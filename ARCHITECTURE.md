# Mock Interview IDE — Architecture

A browser-based coding-interview platform (think CoderPad, free, with native AI features).

**Stack decisions (locked):**

- **Vite + React SPA** (TypeScript)
- **Supabase** — auth + Postgres (session storage) + **Edge Functions** (Deno) for the Claude proxy
- **Zustand** for app state
- **Piston API** for code execution
- **Claude API** (`claude-sonnet-4-6`) for AI hints + review, called only from Edge Functions
- **Tailwind CSS** for styling
- **Monaco Editor** (`@monaco-editor/react`)

---

## 1. Folder structure

```
mock-interview-ide/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx                      # router + providers
│   ├── routes/
│   │   ├── HomePage.tsx             # problem list / dashboard
│   │   ├── SessionPage.tsx          # the IDE (split panel) — the heart
│   │   ├── ReplayPage.tsx           # keystroke playback viewer
│   │   └── AuthPage.tsx             # login / signup
│   │
│   ├── features/                    # feature-first, not type-first
│   │   ├── editor/
│   │   │   ├── CodeEditor.tsx       # @monaco-editor/react wrapper
│   │   │   ├── LanguageSelect.tsx
│   │   │   └── useMonacoKeystrokes.ts   # bridges Monaco events -> recorder
│   │   ├── problems/
│   │   │   ├── ProblemPanel.tsx     # left panel: description/examples
│   │   │   ├── ProblemList.tsx
│   │   │   └── problems.data.ts     # imports JSON, typed
│   │   ├── execution/
│   │   │   ├── RunPanel.tsx         # run button + results
│   │   │   ├── pistonClient.ts      # Piston API wrapper
│   │   │   └── testRunner.ts        # maps test cases -> Piston -> verdicts
│   │   ├── timer/
│   │   │   └── Timer.tsx            # countdown + count-up UI
│   │   ├── keystrokes/
│   │   │   ├── recorder.ts          # append-only event log
│   │   │   └── ReplayPlayer.tsx     # playhead, scrubber, speed
│   │   └── ai/
│   │       ├── HintPanel.tsx        # progressive hints UI
│   │       ├── ReviewPanel.tsx      # post-solve analysis UI
│   │       ├── aiClient.ts          # calls Edge Functions (NOT Claude direct)
│   │       └── useStuckDetector.ts  # idle/stuck timer -> hint eligibility
│   │
│   ├── stores/                      # Zustand
│   │   ├── useSessionStore.ts       # current session: problem, lang, status
│   │   ├── useTimerStore.ts         # mode, elapsed, running
│   │   ├── useKeystrokeStore.ts     # event log + record/replay state
│   │   └── useEditorStore.ts        # code buffer, language
│   │
│   ├── lib/
│   │   ├── supabaseClient.ts        # single Supabase client instance
│   │   └── auth.ts                  # session helpers, useAuth hook
│   │
│   ├── types/
│   │   ├── problem.ts
│   │   ├── session.ts               # KeystrokeEvent, SessionRecord
│   │   └── ai.ts                    # HintResponse, ReviewResponse
│   │
│   └── data/
│       └── problems.json            # ~20-30 problems
│
├── supabase/
│   ├── functions/
│   │   ├── ai-hint/index.ts         # Claude proxy: progressive hint
│   │   ├── ai-review/index.ts       # Claude proxy: solution review
│   │   └── _shared/
│   │       ├── claude.ts            # Anthropic SDK call + prompt caching
│   │       └── cors.ts
│   └── migrations/
│       └── 0001_init.sql            # tables + RLS policies
│
├── .env.local                       # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
└── vite.config.ts
```

**Why feature-first:** each interview talking point ("how does keystroke playback
work?") maps to one folder. Easy to navigate, easy to explain.

---

## 2. The four decisions that actually matter

### A. Keystroke recording — append-only event log, not snapshots

Don't store full-text snapshots per keystroke (huge, redundant). Record **deltas**
from Monaco's `onDidChangeModelContent`, which already gives exact ranges:

```ts
interface KeystrokeEvent {
  t: number;       // ms since session start (relative!)
  range: { startLine: number; startCol: number; endLine: number; endCol: number };
  text: string;    // inserted text ('' = deletion)
  rangeLength: number; // chars removed
}
```

- **Replay** = start from empty buffer, apply events in order, driven by a playhead
  clock. (Same idea as Redux time-travel / event sourcing.)
- **Storage**: store the whole array as `jsonb` in one row. A 45-min session fits
  comfortably. Compress later only if needed.
- **Relative timestamps** make replay speed control trivial and decouple from
  wall-clock.

### B. AI proxy — Edge Functions, key never touches the browser

```
Browser ──fetch──> Supabase Edge Function ──Anthropic SDK──> Claude
         (anon JWT)   (validates user)        (ANTHROPIC_API_KEY
                                               from supabase secrets)
```

- `ANTHROPIC_API_KEY` set via `supabase secrets set` — **never** in any `VITE_` var
  (those ship to the client).
- The function validates the caller's Supabase JWT before spending a Claude call →
  no anonymous abuse of your key.
- Model: **`claude-sonnet-4-6`**.
- **Prompt caching**: system prompt + problem statement are identical across hint
  levels for a problem → cache them; only the "give hint level N" instruction varies.

### C. Progressive hints — a small state machine, gated by "stuck"

```ts
type HintState = {
  level: 0 | 1 | 2 | 3;      // 0 = none given yet
  eligibleAt: number | null; // timestamp when next hint unlocks
};
```

- `useStuckDetector` watches keystroke idle time + total elapsed. After N seconds of
  no meaningful progress it unlocks the next hint.
- Each level is strictly more revealing, and prior hints are passed back so Claude
  never repeats or jumps to the solution. Levels: (1) nudge the approach,
  (2) name the technique/data structure, (3) pseudo-code outline. Never the full answer.

### D. Supabase schema + Row Level Security

```sql
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  problem_id  text not null,
  language    text not null,
  code        text,
  status      text not null default 'in_progress',  -- in_progress|solved|abandoned
  duration_ms integer,
  keystrokes  jsonb not null default '[]',
  ai_review   jsonb,
  created_at  timestamptz not null default now()
);

alter table sessions enable row level security;

create policy "own sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

RLS is the whole backend security model — a user can only read/write their own rows.
Problems stay as static JSON shipped with the app (no table needed).

---

## 3. Build order

1. **Scaffold** — Vite + TS + Tailwind, folders, Supabase client. (done)
2. **Problem + editor shell** — split panel, Monaco, language select, typed problems. (done)
3. **Timer** — both modes, Zustand store.
4. **Code execution** — Piston client + test runner + results panel.
5. **Auth + session persistence** — login, save/load sessions with RLS.
6. **Keystroke recorder + replay** — the showcase feature.
7. **AI Edge Functions** — hint + review, wired to the UI last.

Steps 1–4 give a demoable IDE; 5–7 are the differentiators.

---

## 4. Open trade-offs / future upgrades

- **Test-case format**: v1 uses simple **stdin/stdout** matching via Piston.
  Function-signature harnesses (real LeetCode style) are a later upgrade.
- **Markdown**: problem descriptions are markdown; v1 renders structured fields.
  Add `react-markdown` + Tailwind typography for rich rendering later.
- **Split panel**: v1 uses a fixed flex split. Add `react-resizable-panels` for a
  draggable divider.
