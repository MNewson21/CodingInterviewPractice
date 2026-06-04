# Session Log — Robustness & Deploy-Prep

> **Timestamp:** 2026-06-04 03:23 BST
> **Read-this-first for the next session.** Captures everything done in this session
> and the exact scope of what's left. See also `PROJECT_STATUS.md` (overall state),
> `DEPLOY.md` (hosting steps), and `SESSION-CHANGES-AND-ROADMAP.md` (prior session).

---

## TL;DR for next session
The app is **functionally deploy-ready**. Remaining work to go live on AWS is
**ops/infrastructure, not code** (~an afternoon + a ~$10 domain). Supabase is **live**.
Three robustness clusters (#1–#3) are done, committed, and build-clean. Remaining:
AWS deploy, AI Edge Functions, and 3 lower-priority robustness items.

---

## What this session changed (all committed)

Commits: `c24850a` (markdown prep) → `a501c7b` (cluster 1) → `d987851` (cluster 2)
→ `f217a6e` (cluster 3).

### A. Piston deploy docs/script fixed (the AWS blocker)
Carried the three local-Piston fixes into the deploy assets so an EC2 box won't hit
the same wall: `--privileged`, `-v piston-data:/piston`, and the `/api/v2` base path
(NOT `/api/v2/piston` — that segment only exists on the public emkc host).
- Files: `scripts/setup-piston.sh`, `docs/PISTON_SETUP.md`, `docs/DEPLOY.md`,
  `docs/PROJECT_STATUS.md`.
- Added **`DEPLOY.md` §C0 — free-tier test walkthrough**: throwaway `t3.micro`, no
  domain/Caddy, full end-to-end via the Vite dev proxy pointed at the EC2 IP. Proves
  Piston-on-AWS for pennies before committing to a domain.

### B. Edit screen for custom problems (feature)
Custom problems are now editable in-app (was create-only; a bad harness meant
delete-and-recreate).
- `userProblems.api.ts`: new `updateUserProblem(id, data)` (RLS `for all` permits it).
- `useProblemsStore.ts`: new `updateCustom(p)`.
- `ProblemForm.tsx`: optional `initial?: Problem` prop pre-fills every field (incl.
  harness); submit branches to update; button "Save changes" / "Cancel". Prop
  `onCreated` → `onDone`.
- `MyProblems.tsx`: **Edit** button (new optional `onEdit` prop).
- `HomePage.tsx`: tracks create-vs-edit mode; opens form pre-filled (keyed remount).

### C. Cluster #1 — code-execution failure states
- `pistonClient.ts`: typed `PistonError` (`unavailable` | `rate-limited` | `runtime`);
  `pistonFetch` maps network failure → `unavailable`, HTTP 429 → `rate-limited`.
- `testRunner.ts`: infra errors rethrow ONCE (not per-test); `run.signal` flagged as a
  likely timeout/OOM.
- `RunPanel.tsx`: friendly per-kind banner (`describeRunError`) + empty-code guard.

### D. Cluster #2 — unauthenticated / token-expiry flows
- `sessions.api.ts`: typed `AuthRequiredError` + `requireUserId()`; **both**
  `saveSession` AND `updateSession` now guard auth (update previously didn't → cryptic
  "no rows" on expiry).
- `SessionPage.tsx`: `handleSave` shows "your sign-in expired — code is kept" for auth
  errors + a signed-out guard. (`useAuth` already flips the button reactively.)

### E. Cluster #3 — problem / data edge cases
- `lib/languages.ts`: new `starterFor(problem, language)` — language-correct guiding
  comment (`#` Python / `//` else) instead of a blank editor when a language has no
  starter. Wired into `SessionPage` init + `LanguageSelect`.
- `RunPanel.tsx`: `harnessHint()` detects Python `NameError` / JS `ReferenceError`
  "not defined" and renders an amber hint to match the function name to the harness
  (the `name 'solve' is not defined` mistake).
- Deleted/unknown problem: already handled (`SessionPage` "Problem not found",
  `ReplayPage` "Session not found") — no change needed.

### F. Docs + memory housekeeping
- `PROJECT_STATUS.md`: Supabase marked **active**, Piston active-locally, AI the only
  inert feature; problem count 3→10; create-form/edit/harness moved to "done".
- Memory: new `project-supabase-live.md` (Supabase is LIVE, not deferred);
  `MEMORY.md` index updated.

---

## Current state of each piece
| Piece | State |
|---|---|
| Frontend (Vite/React) | ✅ feature-complete, typecheck + build clean |
| Supabase (auth/save/custom problems) | ✅ **LIVE** (cloud free tier), verified end-to-end |
| Piston (code execution) | ✅ working locally via Docker; ⏳ not yet on AWS |
| AI hints/review | ⏳ Edge Functions not deployed — only inert feature |
| Public hosting | ⏳ not started (Phase 2) |

---

## Scope of what's LEFT to do

### 1. AWS deploy — the main remaining work (ops, ~an afternoon, ~$10 domain)
Follow `DEPLOY.md`. Suggested order: do **§C0 free-tier test first** (pennies, no
domain) to prove Piston-on-EC2, then the real deploy:
1. Frontend → Vercel (set prod env vars: Supabase keys, `VITE_PISTON_URL` full HTTPS,
   `VITE_ENABLED_LANGUAGES`).
2. Supabase → set Site URL / redirect URLs to the live domain.
3. Piston on EC2 (`t3.small` for headroom; `t3.micro` fine for py/js/ts) — Docker
   privileged + volume, install runtimes.
4. **Buy a domain** (REQUIRED — an HTTPS frontend cannot call a raw http EC2 box).
5. Caddy for HTTPS + CORS, DNS A record, Elastic IP; wire `VITE_PISTON_URL` to it.

### 2. AI features (optional, ~30 min) — `AI_SETUP.md`
Deploy `ai-hint` + `ai-review` Edge Functions + a free LLM key (OpenRouter/Groq/Gemini).
Until then the AI buttons stay disabled. Not a deploy blocker.

### 3. Remaining robustness clusters (code, lower priority)
- **Mobile / narrow layout** — the fixed split panel is unusable on phones; stack
  panels or show a "best on desktop" notice. (Most visible gap for a shared link.)
- **Top-level React error boundary** — recovery card instead of a white page.
- **Long sessions** — size guard / save-failure recovery for large keystroke logs.

### 4. Known follow-ups / smaller gaps
- **Buffer-preserve on sign-in**: clicking "Sign in to save" → `/auth` → back re-runs
  `SessionPage` init and re-seeds starter code, losing in-progress work. Needs an
  init/reset-semantics tweak (design choice — deliberately not bundled).
- **AuthPage email-confirm UX**: if email confirmation is turned ON for production,
  sign-up creates no session until confirmed, but `auth.ts signUp()` / AuthPage don't
  surface a "check your inbox" message → could confuse new users. (Fine while
  confirmation is OFF, which is the current dev setting.)
- **Harness-hint regex** is intentionally broad ("X is not defined"); only ever *adds*
  a hint line, so low-risk, but can occasionally match an unrelated error.

---

## Verify / run cheatsheet
```bash
docker start piston            # runtimes persist in the volume
npm run dev                    # http://localhost:5173
npm run typecheck              # clean
npm run build                  # clean
```
