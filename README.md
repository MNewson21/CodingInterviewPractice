# Coding Interview Practice

**A free, browser-based mock technical-interview IDE.** Pick a problem, write a real
solution in a VS Code–grade editor, run it against hidden test cases, get AI feedback —
and then **replay your entire keystroke-by-keystroke thought process** to see how you
actually solved it.

🔗 **Live:** [codinginterviewpractice.dev](https://codinginterviewpractice.dev)

---

## Why this exists

Practising for technical interviews is weirdly fragmented. LeetCode drills algorithms
but feels nothing like a real interview. CoderPad and similar shared-editor tools *do*
feel like the real thing — a live editor, someone watching how you think — but they're
built for companies and sit behind a paywall.

I wanted the middle ground, for free:

- **The feel of a real interview, not a quiz.** A genuine code editor, a problem on one
  side, a timer running, and your code executed against tests you can't see — the same
  pressure shape as a live pairing round.
- **A way to review *how* you think, not just whether you passed.** The standout feature
  is keystroke replay: every edit is recorded, so afterwards you can scrub back through
  your whole attempt and watch where you hesitated, backtracked, or went down a dead end.
  That's the part of interview prep nobody usually gets to see.
- **AI that coaches instead of spoiling.** Hints only unlock once you've actually been
  stuck for a while, and they nudge rather than hand you the answer. A post-solve review
  then talks through correctness and complexity like an interviewer would.
- **Something I can stand behind and explain.** It started as a portfolio project, so the
  architecture is deliberate and the code is meant to be readable end to end.

## Who it's for

- **Candidates** preparing for coding interviews who want realistic reps and honest
  self-review, without a subscription.
- **Students and self-taught developers** building algorithmic fluency across multiple
  languages.
- **Anyone running practice sessions** who wants to author their own problems and share
  them as a file.

## What you can do with it

- Solve **LeetCode-style problems** in **Python, JavaScript, TypeScript, Java, or C++**,
  in a real Monaco (VS Code) editor with syntax highlighting and curated autocomplete.
- **Run your code** against real test cases and get pass / fail / error verdicts with a
  "how close were you" progress bar and friendly handling of compile errors and timeouts.
- **Replay any attempt** keystroke by keystroke on a scrubber with variable speed.
- Use a **timer** in count-up or countdown mode.
- Get **progressive AI hints** (gated until you're genuinely stuck) and an **AI post-solve
  review**, plus a free, in-browser Big-O estimator that uses no AI tokens.
- **Author custom problems** via a form or by dragging in a `.json` file, edit them in
  place, and export any problem to share.
- **Sign in to save sessions**, then resume or replay them later — and delete the ones you
  no longer want.

> New here? The [**User Guide**](./docs/USER-GUIDE.md) walks through every feature.

## Tech stack

| Layer            | Choice                                            |
|------------------|---------------------------------------------------|
| Frontend         | Vite + React 19 + TypeScript (SPA)                |
| Styling          | Tailwind CSS v4                                   |
| State            | Zustand (one store per concern)                   |
| Editor           | Monaco (`@monaco-editor/react`)                   |
| Auth + database  | Supabase (Postgres + Row Level Security)          |
| AI proxy         | Supabase Edge Functions (Deno), provider-agnostic |
| Code execution   | Self-hosted [Piston](https://github.com/engineer-man/piston) sandbox |

A few decisions worth knowing:

- **Keystroke replay is event-sourced.** It stores Monaco's content-change *deltas* with
  relative timestamps rather than full snapshots, so replay is just applying the log over
  an empty buffer against a playhead clock. Compact to store, trivial to speed-control.
- **Security is Row Level Security.** Supabase RLS is the entire backend trust boundary —
  every query is auto-scoped to `auth.uid()`, so a user can only ever read or write their
  own rows. There's no bespoke server code to trust.
- **The AI key never reaches the browser.** Hints and review call a Supabase Edge Function
  that holds the LLM key server-side and validates the caller's JWT first. The proxy is
  OpenAI-compatible, so it can point at any provider.

## Getting started (local dev)

**Prerequisites:** Node 20+ and (to run user code locally) Docker.

```bash
npm install
npm run dev        # http://localhost:5173
```

The app boots and is usable without any backend — auth, run, and AI features simply stay
inert until you wire up their services.

### Environment variables

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co   # base host only, no /rest/v1
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_PISTON_URL=/piston/api/v2                            # dev proxy path
VITE_ENABLED_LANGUAGES=python,javascript,typescript,java,cpp   # optional; unset = all
```

LLM secrets are **not** here — they live in Supabase Edge Function secrets, never in a
`VITE_` variable (those ship to the browser).

### Backend pieces (each independent, each optional to start)

| Piece            | What it powers                        |
|------------------|---------------------------------------|
| **Piston**       | Running submitted code                |
| **Supabase**     | Auth, saved sessions, custom problems |
| **AI functions** | Hints & review _(optional)_           |

Quick local Piston:

```bash
docker run --privileged -d --name piston -p 2000:2000 \
  -v piston-data:/piston ghcr.io/engineer-man/piston
bash scripts/setup-piston.sh        # installs the language runtimes
```

After that, day-to-day is just `docker start piston` (runtimes persist in the volume).

### Scripts

```bash
npm run dev          # start the dev server
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + production build
npm run preview      # preview the production build
```

## Project structure

```
src/
  routes/        HomePage, SessionPage (the IDE), ReplayPage, auth
  features/      feature-first: editor, problems, execution, timer,
                 keystrokes, ai, analysis, sessions, auth
  stores/        Zustand stores (editor, timer, execution, session, keystroke, ai, problems)
  lib/           supabase client, auth helpers, language config
  components/    shared UI (e.g. ErrorBoundary)
  data/          built-in seed problems (JSON)
  types/         Problem, KeystrokeEvent, SessionRecord, AI types
supabase/
  migrations/    sessions + user_problems tables with RLS
  functions/     ai-hint, ai-review Edge Functions + shared LLM proxy
docs/            user guide
```

## Deployment

Three independently-hosted pieces: the frontend (Vercel, free), Supabase (free tier), and
Piston on a small AWS EC2 box (the only part that costs money).

## License

[MIT](./LICENSE)
