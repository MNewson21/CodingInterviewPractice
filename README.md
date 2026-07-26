# Coding Interview Practice

**A free, browser-based mock technical-interview IDE.** Pick a problem, write a real
solution in a VS Code-grade editor, run it against different test cases. Then **replay your entire keystroke-by-keystroke thought process** to see how you actually solved it.

🔗 **Live:** [codinginterviewpractice.dev](https://codinginterviewpractice.dev)

---
https://github.com/user-attachments/assets/2809ad8b-c0d5-44ec-bec7-9cfa49908753


## Why this exists
I have tried using many other sites to practice coding problems and to improve my abilities at coding. However, when using other websites, sometimes I may get stuck and the way to understand how to do it is to see the answer through already solved questions. I wanted to create something where if I got stuck, it woulnt show me the concrete implementation of it but rather steer me towards it through hinting at data structures to use and time complexities. 

There are also some other features which I wanted to use aswell. One of my personal favourite features in a coding editor
is autocomplete where it will show you some available methods and how to use them. I find this especially useful for Python since there are many methods in-built and it can be hard to remember the spelling and use of each method. So, within this project, I have included some key methods in the autocomplete so that for these practice questions, it will be easier to solve them since you can see what methods may be useful to use. 

I also wanted to build this project, so that I can solve these current problems which are pretty standard across most similar coding practice sites, and I also wanted to experiment with making my own problems. This is because, you can get bored of doing a setlist of problems and so with this, you can create a problem and export it as a JSON so that you can reuse it or challenge someone else.





## Who it's for

- **Candidates** preparing for coding interviews who want practice problems and honest
  self-reviews, without paying for a subscription.
- **Students and self-taught developers** building algorithmic fluency across multiple
  languages and will help with overall understanding of how to solve different types of problems.
- **Anyone running practice sessions** who wants to author their own problems and share
  them as a file so they can challenge their friends or peers.

## What you can do with it

- Solve **Tricky Coding Problems** in **Python, JavaScript, TypeScript, Java, or C++**,
  in a real Monaco (VS Code) editor with syntax highlighting and curated autocomplete.
- **Run your code** against real test cases and get pass / fail / error verdicts with a
  "how close were you" progress bar and friendly handling of compile errors and timeouts.
- **Replay any attempt** keystroke by keystroke on a scrubber with variable speed.
- Use a **timer** in count-up or countdown mode to practice for time management.
- Get **progressive AI hints** and an **AI post-solve review**, plus a free, in-browser Big-O estimator
- **Author custom problems** via a form or by dragging in a `.json` file, edit them in
  place, and export any problem to share and challenge others
- **Sign in to save sessions**, then resume or replay them later - and delete the ones you
  no longer want/need. You can either sign up with Google or email currently.

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
| Testing          | Using Vitest and CI/CD pipeline / GitHub Actions |

## License
[MIT](./LICENSE)
