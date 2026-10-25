# Coding Interview Practice

A browser-based mock interview IDE. Pick a problem, write a real solution in a proper code
editor, run it against the test cases, then replay your own keystrokes to see how you
actually got there.

🔗 **Live:** [codinginterviewpractice.dev](https://codinginterviewpractice.dev)

> The hosted site is a demo. Code execution runs on a separate self-hosted sandbox that is
> not guaranteed to be up, so Run may come back unavailable there. Everything else on the
> site works regardless, and running it locally against your own sandbox gets you execution
> back.

---

## Why this exists

I have tried a lot of other sites for practising coding problems, and the thing that kept
bothering me was what happens when you get stuck. Usually the only way forward is to open
someone else's finished solution, which hands you the answer but not the route to it. I
wanted something that nudges you towards the approach instead, by hinting at the data
structure worth reaching for or the complexity you should be aiming at, and leaves the
implementation to you.

The other thing I missed was decent autocomplete. Seeing which methods are available as you
type is one of my favourite parts of writing code in an editor, and it matters most in
Python, where there are so many built-in methods that remembering the exact spelling of each
one becomes its own small task. So the editor here ships with a curated set of them, scoped
to what these problems actually need.

I also wanted room to write my own problems. A fixed list goes stale once you have been
through it, so you can author a problem in the app, export it as JSON, and hand it to
someone else to attempt.

## What you can do

- Solve problems in **Python, JavaScript, TypeScript, Java or C++**, in a real Monaco (VS
  Code) editor with syntax highlighting and the curated autocomplete mentioned above.
- Run your code against the problem's test cases and get a verdict per case, along with a
  "how close were you" bar. Compile errors and timeouts come back as something readable
  rather than a blank failure.
- Replay any attempt keystroke by keystroke on a scrubber, at whatever speed you want.
- Time yourself counting up, or set a countdown if you are practising for a real slot.
- Ask for an AI hint, which gets more specific each time you ask instead of giving the game
  away on the first one. Once you have solved the problem you can also get a written review
  of what you wrote.
- Get a Big-O estimate for your solution, worked out locally in the browser.
- Follow a curated track rather than picking at random. Eight of them ship today:
  Interviews, Easy Warmup, Blind 75 (in catalog), Dynamic Programming, Trees & Linked Lists,
  Two Pointers & Sliding Window, Hard Mode, and Demon List.
- Read up on a pattern before attempting it. The revision pages cover 14 patterns and data
  structures, each with what it is, the signals that should make you reach for it, a short
  code sketch, and problems in the catalog to go and try it on.
- Author your own problems through a form, or drag a `.json` file straight in. You can edit
  them in place afterwards and export any problem back out to share.
- Sign in with Google or email to save sessions, then resume or replay them later. You can
  delete the ones you no longer want, and delete your account outright if you want to leave.

The catalog holds 109 built-in problems, weighted towards the easier end: 55 easy, then 36
medium and 18 hard.

> New here? The [**User Guide**](./docs/USER-GUIDE.md) walks through every feature properly.

## How some of it works

The parts that took the most thought, in case you are reading the source rather than using
the app.

**One problem definition, five languages.** A problem is a single JSON object holding a
description, parameter metadata, test cases, and a per-language harness. The harness is what
adapts the same stdin fixture to each toolchain, so one authored problem yields a working
Python stub and a working C++ stub without the author writing either. Adding a language is a
matter of teaching the builder one more target rather than rewriting 109 problems. The
builder scripts emit these definitions, and `problems.data.test.ts` is a catalog integrity
suite that fails the build if a problem is internally inconsistent.

**Judging answers that have no single correct output.** Most problems can be compared as
strings. Some cannot: Letter Combinations is correct no matter what order the combinations
come back in, so comparing stdout to one canonical answer fails perfectly good solutions. A
problem can declare `judge: 'unordered'`, which compares results as a multiset instead, so
order stops mattering while duplicates still do. Not every problem fits even that. Course
Schedule II has many valid topological orders that are not permutations of each other, so it
needs a validator that re-checks the constraints rather than any kind of comparison, and it
is deliberately not in the catalog yet.

**Replay is recorded, not reconstructed.** Monaco's change events get turned into a
timestamped keystroke log, stored per session, and played back through a scrubber. It is an
append-only log of edits rather than periodic snapshots, which is what makes scrubbing to an
arbitrary point possible. That log can reach a few megabytes per session, so the history and
progress pages never select it. A generated column on the table carries the one fact those
pages actually wanted, which is how much was typed.

**Everything a user owns is isolated in the database.** Saved sessions and custom problems
sit behind Postgres row level security, so a user can only ever reach their own rows, and
the policy is enforced by the database rather than by application code remembering to filter.
Custom problems are stored as a single jsonb blob of the problem definition, which means new
optional fields need no migration.

**AI stays behind a proxy.** Hints and reviews go through Supabase Edge Functions, so no API
key is ever in the browser bundle, and the provider can be swapped without touching the
frontend. The Big-O estimator is deliberately not an AI call at all. It runs locally, costs
nothing, and works offline.

## Running it locally

You need Node 20 or newer.

```bash
git clone https://github.com/MNewson21/CodingInterviewPractice.git
cd CodingInterviewPractice
npm install
npm run dev
```

That gets the app open with the full catalog and the editor working. Two things are external
and optional:

| Variable                                            | What it does                                |
|-----------------------------------------------------|---------------------------------------------|
| `VITE_PISTON_URL`                                   | Your [Piston](https://github.com/engineer-man/piston) sandbox, which is what actually runs submitted code. Without one, Run reports the service as unavailable and nothing else is affected. |
| `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`    | Your Supabase project, which backs sign-in and saved sessions. Leave both unset and the editor still works, you just cannot sign in or save anything. |

Put them in a `.env.local` at the project root, noting the leading dot.

### Scripts

| Command              | What it runs                                  |
|----------------------|-----------------------------------------------|
| `npm run dev`        | Vite dev server                               |
| `npm run build`      | Typecheck, then a production build            |
| `npm run preview`    | Serve the built output                        |
| `npm run typecheck`  | `tsc --noEmit` on its own                     |
| `npm test`           | Full Vitest run                               |
| `npm run test:watch` | Vitest in watch mode                          |
| `npm run coverage`   | Vitest with a V8 coverage report              |

Worth knowing: `npm test` does not typecheck, so run `npm run typecheck` separately before
you trust a green suite.

## Tech stack

| Layer            | Choice                                            |
|------------------|---------------------------------------------------|
| Frontend         | Vite + React 19 + TypeScript (SPA)                |
| Styling          | Tailwind CSS v4                                   |
| State            | Zustand, one store per concern                    |
| Routing          | React Router v7                                   |
| Editor           | Monaco (`@monaco-editor/react`)                   |
| Auth + database  | Supabase (Postgres with Row Level Security)       |
| AI proxy         | Supabase Edge Functions (Deno), provider-agnostic |
| Code execution   | Self-hosted Piston sandbox                        |
| Tests            | Vitest, with jsdom and React Testing Library for component tests |

## Security

Found a security issue? Please read [SECURITY.md](./SECURITY.md) and report it the way it
describes, rather than opening a public issue.

## License

[MIT](./LICENSE)
