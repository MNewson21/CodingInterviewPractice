# Project Status — Mock Interview IDE

> Read-this-first handoff doc. Captures the full current state so a new
> conversation can get up to speed without re-deriving anything.
> See also: `ARCHITECTURE.md`, and the setup guides in `docs/`.

Last updated: 2026-06-04.

## What it is
A browser-based coding-interview practice platform (CoderPad-like, free, with
native AI). Built as a portfolio project. Original brief: `BRIEF.md`.

## Stack (locked)
- **Vite + React 19 + TypeScript** SPA
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Zustand** for state (one store per concern)
- **Monaco Editor** (`@monaco-editor/react`)
- **Supabase** — auth + Postgres + Edge Functions
- **Piston** (self-hosted) for code execution
- **Provider-agnostic LLM** (OpenAI-compatible) for AI, default free OpenRouter model

## Status: feature-complete
All 7 planned steps + the custom-problems feature are **built, typecheck-clean,
and build-clean**. What's left is **infrastructure activation** (deferred by
choice), not code — see "Deferred setup" below.

### Features built
1. **Scaffold** — Vite/TS/Tailwind, feature-first folders.
2. **Editor shell** — Monaco, split panel, language select, typed problems.
3. **Timer** — count-up + countdown, drift-corrected.
4. **Code execution** — Piston client + stdin/stdout test runner + Run panel with
   pass/fail/error verdicts and a **test-pass progress bar** (closeness score).
5. **Auth + persistence** — Supabase email auth; sessions saved with RLS.
6. **Keystroke replay** — records Monaco deltas (event-sourced), replays on a
   scrubber/speed playhead, seeded from starter code.
7. **AI** — progressive hints (stuck-gated) + post-solve review via Edge Functions.
   On-demand only. Plus a **free in-browser complexity estimator** (loop-nesting
   heuristic, labeled "rough estimate") — no tokens.
8. **Custom problems** — author via a **create-problem form** OR drag-and-drop `.json`
   import (both validated through the same parser) into a Supabase `user_problems`
   table; **Edit** a saved problem in-place (form pre-fills, incl. harness); **Export**
   any problem to a shareable `.json`; "Your problems" list. Sharing is file-based
   (no server sharing infra).

## Routes
- `/` — HomePage (problem list, sign-in, import + your problems, recent sessions)
- `/auth` — sign in / sign up
- `/session/:problemId` — the IDE (works for built-in AND custom problem ids)
- `/replay/:sessionId` — keystroke replay viewer

## File map (key modules)
```
src/
  App.tsx                         routes
  types/{problem,session,ai}.ts   Problem, KeystrokeEvent, SessionRecord, AI types
  lib/
    supabaseClient.ts             single client + isSupabaseConfigured (never throws)
    auth.ts                       useAuth, signIn/signUp/signOut
    languages.ts                  ENABLED_LANGUAGES (from VITE_ENABLED_LANGUAGES)
  stores/                         zustand: editor, timer, execution, session,
                                  keystroke, ai, problems
  features/
    editor/CodeEditor.tsx         Monaco + records keystrokes (skips isFlush)
    editor/LanguageSelect.tsx     dropdown limited to ENABLED_LANGUAGES
    problems/problems.data.ts     built-in set + getProblem() (built-in + custom)
    problems/problemFile.ts       import validation + export/download (schemaVersion)
    problems/userProblems.api.ts  Supabase CRUD for custom problems
    problems/ImportDropzone.tsx   drag-and-drop import
    problems/MyProblems.tsx       custom list + Export + Delete
    problems/ProblemPanel.tsx     problem description panel
    timer/Timer.tsx
    execution/{pistonClient,testRunner,RunPanel}.ts(x)
    keystrokes/{recorder,ReplayPlayer}.ts(x)
    analysis/{complexity.ts,ComplexityBadge.tsx}   free Big-O estimator
    ai/{aiClient,useStuckDetector,HintPanel,ReviewPanel,AiPanel}.ts(x)
    auth/AuthPage.tsx
    sessions/{sessions.api.ts,SessionHistory.tsx}
  data/problems.json              10 built-in seed problems (Two Sum … Edit Distance), each with hidden harness + params
supabase/
  migrations/0001_init.sql        sessions table + RLS
  migrations/0002_user_problems.sql  user_problems table + RLS
  functions/_shared/{cors,llm}.ts provider-agnostic LLM proxy (key server-side)
  functions/ai-hint/, ai-review/  Edge Functions
scripts/setup-piston.sh           installs Piston runtimes (light set by default)
docs/                             ARCHITECTURE, PISTON_SETUP, SUPABASE_SETUP, AI_SETUP, DEPLOY, this file
vite.config.ts                    dev proxy: /piston -> localhost:2000 (avoids CORS)
vercel.json                       SPA rewrite for client-side routes
```

## Environment variables (`.env.local`; note the leading dot)
```
VITE_SUPABASE_URL=https://<ref>.supabase.co     # BASE url only, no /rest/v1
VITE_SUPABASE_ANON_KEY=<anon jwt>
VITE_PISTON_URL=/piston/api/v2                   # dev: proxy path; prod: full https URL (self-host serves /api/v2)
VITE_ENABLED_LANGUAGES=python,javascript,typescript   # optional; unset = all 5
```
LLM secrets live in Supabase (NOT here): `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.

## Run / verify
```
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc --noEmit  (clean)
npm run build        # vite build    (clean)
```
The app runs without any backend; auth/save/run/AI just stay inert until activated.

## Setup status (infra, each independent)
1. **Piston** (code execution): ✅ **active locally** — self-hosted via Docker
   (`docs/PISTON_SETUP.md`). Public emkc endpoint is whitelist-only since 2026-02-15;
   `scripts/setup-piston.sh` installs a light language set (py/js/ts). Still needs an
   AWS box for the public demo (Phase 2).
2. **Supabase** (auth/save/custom problems): ✅ **active** — project provisioned,
   migrations 0001 + 0002 run, auth working. Sign-in, session save/resume, and custom
   problems (create/edit/import/export) all function end-to-end. (`docs/SUPABASE_SETUP.md`)
3. **AI** (hints/review): ⏳ **deferred** — `docs/AI_SETUP.md`. Deploy the two Edge
   Functions and set a free LLM key. On-demand only; the only remaining inert feature.
4. **Deploy**: `docs/DEPLOY.md` — Vercel (frontend) + Supabase + Piston on AWS EC2
   (Caddy for HTTPS/CORS). Remember to tear down EC2 + release the Elastic IP after.

## Gotchas already solved (don't re-debug)
- `.env.local` MUST have the leading dot; `env.local` is ignored by Vite.
- `VITE_SUPABASE_URL` must be the base host, NOT the `/rest/v1/` REST endpoint.
- An HTTPS frontend can't call HTTP/cross-origin backends → dev uses the Vite
  `/piston` proxy; prod uses Caddy with a CORS header.
- Supabase client uses a placeholder URL when unconfigured so it never throws at
  import (a blank screen bug we hit).

## Planned / not yet built
- **AI Edge Functions** not yet deployed (hints/review inert until then) — see
  `docs/AI_SETUP.md`.
- **Phase 2 — AWS hosting** for the public demo (Piston on EC2 + domain): see
  `docs/DEPLOY.md` (includes a C0 free-tier test walkthrough).
- **Robustness pass**: edge/error states (Piston down, compile errors, empty input,
  unauthenticated, narrow/mobile).
- (Optional) More seed problems (currently 10); richer markdown problem rendering.

> Built since this list last named them: the **create-problem form**, **in-place edit**
> for custom problems, and the **LeetCode-style hidden harness** are all done.
