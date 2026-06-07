# Mock Interview IDE

A browser-based coding-interview practice platform — think CoderPad, free, with AI
features built in natively. Pick a LeetCode-style problem, write a solution in a real
Monaco (VS Code) editor, run it against test cases, and **replay your entire
keystroke-by-keystroke thought process** afterwards.

Built as a portfolio project to demonstrate full-stack architecture, not just feature
count. The interesting parts are documented below and in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

> _Live demo: coming once hosted (see [Deployment](#deployment))._
> _Screenshot / GIF placeholder — add a recording of a solve + replay here._

---

## Features

- **Real editor** — Monaco (the editor that powers VS Code) with per-language syntax
  highlighting and a resizable split layout (problem on the left, editor on the right).
  Responsive: stacks vertically on mobile.
- **Code execution** — run your solution against real test cases via a self-hosted
  [Piston](https://github.com/engineer-man/piston) sandbox. Pass/fail/error verdicts
  with a closeness progress bar, and friendly error states for compile errors,
  timeouts, and a downed runtime.
- **Keystroke replay** — every edit is recorded as an event-sourced delta log and can
  be replayed on a scrubber with variable speed. The showcase feature.
- **Timer** — count-up and countdown modes, drift-corrected.
- **AI hints & review** _(optional)_ — progressive, "stuck"-gated hints that nudge
  without spoiling, plus a post-solve review of correctness and complexity. The LLM key
  lives only in a server-side Edge Function, never in the browser. Also ships a **free,
  in-browser Big-O estimator** that uses no tokens.
- **Custom problems** — author your own via a form or drag-and-drop `.json` import,
  edit them in place, and export any problem as a shareable file. Includes a
  LeetCode-style **hidden harness** so authors write just the function while the I/O
  glue is appended at run time.
- **Auth & persistence** — sign in, save a session, and resume or replay it later.

## Architecture highlights

The decisions worth talking about in an interview (full write-up in
[`ARCHITECTURE.md`](./ARCHITECTURE.md)):

- **Keystroke replay via event sourcing.** Rather than storing full-text snapshots per
  keystroke, it records Monaco's content-change *deltas* with relative timestamps.
  Replay = apply the event log over an empty buffer, driven by a playhead clock — the
  same idea as Redux time-travel. Compact storage, trivial speed control.
- **Security model is Row Level Security.** Supabase RLS *is* the entire backend trust
  boundary: every query is automatically scoped to `auth.uid()`, so a user can only ever
  read/write their own rows. There's no server code to trust.
- **The AI key never touches the client.** Hints/review call a Supabase Edge Function
  that holds the LLM key server-side and validates the caller's JWT first — no anonymous
  abuse of the key. The proxy is OpenAI-compatible, so it can point at any free provider.
- **Hidden harness for code execution.** Problems carry a per-language harness that's
  appended to the user's function at run time, giving a real LeetCode-style "write the
  function" experience over a simple stdin/stdout sandbox.

## Tech stack

| Layer            | Choice                                            |
|------------------|---------------------------------------------------|
| Frontend         | Vite + React 19 + TypeScript (SPA)                |
| Styling          | Tailwind CSS v4                                   |
| State            | Zustand (one store per concern)                   |
| Editor           | Monaco (`@monaco-editor/react`)                   |
| Auth + database  | Supabase (Postgres + RLS)                         |
| AI proxy         | Supabase Edge Functions (Deno), provider-agnostic |
| Code execution   | Self-hosted Piston                                |

## Getting started

**Prerequisites:** Node 20+ and (for running code locally) Docker.

```bash
npm install
npm run dev        # http://localhost:5173
```

The app boots and is usable without any backend — auth, save, run, and AI features
simply stay inert until you wire up their services below.

### Environment variables

Create `.env.local` (note the leading dot):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co   # base host only, no /rest/v1
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_PISTON_URL=/piston/api/v2                            # dev proxy path (see below)
VITE_ENABLED_LANGUAGES=python,javascript,typescript      # optional; unset = all
```

LLM secrets are **not** here — they live in Supabase Edge Function secrets, never
in a `VITE_` variable.

### Backend pieces (each independent, each optional to start)

| Piece            | What it powers              | Setup guide                                |
|------------------|-----------------------------|--------------------------------------------|
| **Piston**       | Running code                | [`docs/PISTON_SETUP.md`](./docs/PISTON_SETUP.md) |
| **Supabase**     | Auth, saved sessions, custom problems | Supabase project + DB migrations |
| **AI functions** | Hints & review _(optional)_ | OpenAI-compatible LLM via Supabase Edge Function |

Quick Piston (local):

```bash
docker run --privileged -d --name piston -p 2000:2000 \
  -v piston-data:/piston ghcr.io/engineer-man/piston
bash scripts/setup-piston.sh        # installs Python + JS + TS runtimes
```

Day-to-day after that: `docker start piston` (runtimes persist in the volume).

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
docs/            Piston setup guide + privacy notice
```

## Deployment

The app is three independently-hosted pieces: the frontend (Vercel, free), Supabase
(free tier), and Piston on a small AWS EC2 box (the only part that costs money).

## License

[MIT](./LICENSE)
