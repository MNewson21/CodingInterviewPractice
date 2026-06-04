# Session Changes & Roadmap

> Snapshot written **2026-06-04**. Summarises everything changed in this work
> session and the planned direction of the project. See also `PROJECT_STATUS.md`
> (overall state), `ARCHITECTURE.md` (design), and the setup guides in `docs/`.

---

## 1. What changed this session

### A. Create-problem form (author problems without writing JSON)
- **New:** `src/features/problems/ProblemForm.tsx` — a form to create a custom
  problem (title, difficulty, tags, description, examples, constraints, starter
  code per language, test cases).
- Wired into `src/routes/HomePage.tsx` via a **"+ Create a problem"** toggle in the
  "Your problems" section (swaps the import dropzone for the form).
- It builds a draft and validates it through the **same** `parseProblemData` used
  for `.json` import, so form-made and file-imported problems are identical in shape.

### B. Resume & edit saved sessions
Previously "in progress" sessions could only be replayed, not continued.
- `stores/useTimerStore.ts` — added `setElapsedMs` (seed elapsed time).
- `stores/useKeystrokeStore.ts` — added `resumeRecording(events)`, which reloads the
  saved keystroke log and anchors `startTime` so **new** keystrokes timestamp *after*
  the last saved one (keeps replay strictly ordered).
- `features/sessions/sessions.api.ts` — added `updateSession(id, input)` (RLS `for all`
  already permits UPDATE).
- `routes/SessionPage.tsx` — reads `?session=<id>`; when present it reloads the saved
  code/language/elapsed/keystrokes and resumes. **Save** then *updates* that row
  instead of inserting a new one.
- `features/sessions/SessionHistory.tsx` — added an **"Edit"** link →
  `/session/:problemId?session=:id`.

### C. More problems (3 → 10)
Added 7 problems to `src/data/problems.json` (all **integer outputs** for
cross-language robustness; every test case verified against reference solutions):
- **Medium:** Maximum Subarray, Longest Substring Without Repeating Characters,
  House Robber, Coin Change, Number of Islands.
- **Hard:** Trapping Rain Water, Edit Distance.

### D. Local end-to-end hosting fixed (Piston) — *the big blocker*
Self-hosted Piston wasn't working. Three separate root causes, all now fixed:
1. **Missing `--privileged`** → `mkdir: cannot create directory 'isolate/'`.
2. **Missing data volume** → `chown: cannot access '/piston'`.
3. **Wrong API path** → the self-hosted image serves at **`/api/v2`**, not
   `/api/v2/piston` (that extra segment only exists on the public emkc.org host).

Working local setup:
```bash
docker run --privileged -d -p 2000:2000 --name piston -v piston-data:/piston ghcr.io/engineer-man/piston
bash scripts/setup-piston.sh http://localhost:2000/api/v2   # NOTE: /api/v2, not /api/v2/piston
```
`.env.local` updated:
```
VITE_PISTON_URL=/piston/api/v2
VITE_ENABLED_LANGUAGES=python,javascript,typescript
```
Day-to-day: `docker start piston` (runtimes persist in the volume) → `npm run dev`.

> ✅ **Fixed (2026-06-04):** the same three bugs were carried over into
> `docs/PISTON_SETUP.md`, `docs/DEPLOY.md`, `scripts/setup-piston.sh`, and
> `docs/PROJECT_STATUS.md` — all now use `--privileged`, `-v piston-data:/piston`, and
> the `/api/v2` base. `docs/DEPLOY.md` also gained a **C0 free-tier test walkthrough**
> (throwaway `t3.micro`, no domain/Caddy, end-to-end via the Vite proxy).

### E. LeetCode-style hidden harness + better results panel
Problem: function-only starter code printed nothing, so every test showed
`actual: (empty)`. Fixed by moving the I/O glue into a hidden, run-time-appended
harness so the editor shows **only the function**.
- `types/problem.ts` — added optional `harness?` (per-language glue) and `params?`
  (argument names for the input display).
- `features/execution/testRunner.ts` — `buildSource()` appends the harness to the
  user's code (prepends `// @ts-nocheck` for TypeScript so Node `require` compiles);
  `TestResult` now carries `input`.
- `features/execution/RunPanel.tsx` — passes `problem.harness`; shows
  **input / expected / actual for passing cases too** (previously only on failure);
  `formatInput()` renders stdin as named args (e.g. `word1="sunday", word2="saturday"`).
- `src/data/problems.json` — all 10 problems given `harness` + `params`;
  **Number of Islands** converted to a single-line JSON-grid input for uniformity.
- Verified: **76/76** sandbox executions correct (10 problems × Python & JS).

### F. Harness support in the create-problem form
- `features/problems/problemFile.ts` — `parseProblemData` now validates and returns
  `harness` + `params` (also makes export → import **lossless** for these fields).
- `ProblemForm.tsx` — added a **Run harness** section (one editable code box per
  language, **pre-filled** with default glue the author can trim/extend) and a
  **Function arguments** section (name + "string" quote toggle for the input display).
- The default harness is pre-filled with a guiding comment:
  `# rename solve(...) below to match your function's name`.

---

## 2. Known gaps / immediate TODOs

- ~~**No edit screen for custom problems** — the form only *creates*~~ — ✅ **done
  (2026-06-04)**: `MyProblems` has an **Edit** button; `ProblemForm` takes an optional
  `initial` problem and pre-fills every field (incl. harness) to update in place via
  `updateUserProblem`. A wrong harness function name is now fixable in-app.
- **Harness/function-name mismatch is easy to hit** — the prefilled harness calls
  `solve(...)`; the author must rename it to match their function (now flagged by an
  inline comment).
- ~~**Piston deploy docs/script are still wrong** (privileged, volume, `/api/v2`)~~ —
  ✅ **done (2026-06-04)**; docs/script corrected + C0 free-tier test walkthrough added.
- ~~**Supabase activation** still pending~~ — ✅ **active (2026-06-04)**: project
  provisioned, migrations `0001` + `0002` run, auth working; sign-in, save/resume, and
  custom problems (create/edit/import/export) all verified end-to-end. *Still optional:
  deploy the AI Edge Functions (`docs/AI_SETUP.md`) — hints/review stay inert until then.*
- `problems.json` was reformatted to standard 2-space JSON when regenerated (same data,
  larger diff).

---

## 3. Project direction / roadmap

Goal: a polished, self-hostable mock-interview IDE good enough to **show off on
LinkedIn** as a portfolio piece.

### Phase 1 — Make it robust (before paying for hosting)
- [x] **Fix the Piston deploy assets** (`docs/PISTON_SETUP.md`, `docs/DEPLOY.md`,
      `scripts/setup-piston.sh`): add `--privileged`, `-v piston-data:/piston`, and the
      `/api/v2` base + Caddy reverse-proxy path. (Carry over the three local fixes.)
      *Done 2026-06-04 — also added a C0 free-tier test walkthrough to `docs/DEPLOY.md`.*
- [x] **Add edit for custom problems** so a bad harness can be fixed in-app.
      *Done 2026-06-04 — Edit button + `initial`-prefilled `ProblemForm` → `updateUserProblem`.*
- [ ] **Full end-to-end pass** with Supabase live: sign up/in, run tests, save, resume,
      replay, AI hints/review, create/import/export custom problems.
- [ ] **Edge cases & error states** *(in progress)*:
      - [x] **Piston down / rate-limited / timeout / empty code** — done 2026-06-04
            (cluster #1): typed `PistonError` (`unavailable`/`rate-limited`/`runtime`),
            infra errors surfaced once not per-test, `run.signal` flagged as timeout,
            friendly `RunPanel` banner + empty-code guard. Compile errors already handled.
      - [ ] Long sessions (large keystroke log) — size guard / save-failure recovery.
      - [x] **Unauthenticated flows** — done 2026-06-04 (cluster #2): typed
            `AuthRequiredError`; `saveSession` + `updateSession` both guard auth;
            `handleSave` shows a clear "sign-in expired / sign in to save — code is kept"
            message and a signed-out guard. *Follow-up: signing in via the link still
            re-seeds starter code on return — buffer-preserve needs an init/reset tweak.*
      - [ ] Mobile / narrow layout — stack panels or "best on desktop" notice.
      - [ ] Top-level React error boundary (recovery card, not a white page).
- [ ] (Optional) More seed problems; richer markdown problem rendering.

### Phase 2 — Host on AWS + custom domain
- [ ] **Frontend** on Vercel (or S3 + CloudFront): set production env vars
      (`VITE_PISTON_URL` = full HTTPS URL, `VITE_ENABLED_LANGUAGES`, Supabase keys).
- [ ] **Supabase** stays on the cloud free tier; set the Site URL to the live domain.
- [ ] **Piston on EC2** (t3.small, ~2 GB): run privileged + volume, install runtimes,
      front it with **Caddy** for automatic HTTPS + CORS, attach an **Elastic IP**.
- [ ] **Buy a domain**, add an A record (`piston.yourdomain.com` → Elastic IP) and point
      the app domain at the frontend host.
- [ ] **Teardown plan**: terminate EC2 + release the Elastic IP when the demo period
      ends, so the bill stops (~$8–15/mo while running).

### Phase 3 — Showcase
- [ ] Polish README + a short demo (screens or a screen-recording / GIF).
- [ ] Seed a few impressive problems; make a clean first-run experience.
- [ ] LinkedIn talking points (what makes it interview-worthy):
  - **Keystroke replay** via event sourcing (delta log, relative timestamps).
  - **Hidden harness** model (LeetCode-style: write the function, glue is appended).
  - **Security**: Supabase Row Level Security as the whole backend trust model;
    LLM key only ever in Edge Functions, never in the client.
  - **Self-hosted code execution** (Piston) and the infra debugging behind it.
  - File-shareable custom problems (drag-drop JSON import/export).

---

## 4. Current local run cheatsheet
```bash
docker start piston            # or the full run cmd in §1.D if the container is gone
npm run dev                    # http://localhost:5173
npm run typecheck              # tsc --noEmit (clean)
npm run build                  # vite build
docker stop piston             # when done
```
