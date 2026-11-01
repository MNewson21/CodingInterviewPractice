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
https://github.com/user-attachments/assets/2809ad8b-c0d5-44ec-bec7-9cfa49908753


## Why this exists
I have tried using many other sites to practice coding problems and to improve my abilities at coding. However, when using other websites, sometimes I may get stuck and the way to understand how to do it is to see the answer through already solved questions. I wanted to create something where if I got stuck, it woulnt show me the concrete implementation of it but rather steer me towards it through hinting at data structures to use and time complexities. 

There are also some other features which I wanted to use aswell. One of my personal favourite features in a coding editor
is autocomplete where it will show you some available methods and how to use them. I find this especially useful for Python since there are many methods in-built and it can be hard to remember the spelling and use of each method. So, within this project, I have included some key methods in the autocomplete so that for these practice questions, it will be easier to solve them since you can see what methods may be useful to use. 

I also wanted to build this project, so that I can solve these current problems which are pretty standard across most similar coding practice sites, and I also wanted to experiment with making my own problems. This is because, you can get bored of doing a setlist of problems and so with this, you can create a problem and export it as a JSON so that you can reuse it or challenge someone else.





## Who it's for

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


## Types of Problems
- It has many different lists of similar types of questions and their approaches
- You can also revise these approaches with example code on the Revise page
- The website has many questions of varying difficulty and I am constantly adding more


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
| Code execution   | Self-hosted [Piston](https://github.com/engineer-man/piston) sandbox |
| Testing          | Using Vitest and CI/CD pipeline / GitHub Actions |

## License
[MIT](./LICENSE)
