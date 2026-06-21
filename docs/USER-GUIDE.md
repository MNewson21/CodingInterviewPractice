# User Guide

A walkthrough of everything you can do in **Coding Interview Practice**
([codinginterviewpractice.dev](https://codinginterviewpractice.dev)). No account is
needed to start solving - signing in does add saving, replay history, and custom
problems though.

---

## 1. Picking a problem

The home page lists the built-in coding problems. Each shows its title and
difficulty. Click one to open it in the IDE.

If you're signed in, your recent attempts ("sessions") also appear here, each with
**Edit**, **Replay**, and **Delete** actions (see [Saved sessions](#6-saved-sessions)).

## 2. The IDE

Opening a problem gives you the split-screen workspace:

- **Left - the problem.** Description, examples, and constraints.
- **Right - the editor.** A real Monaco (VS Code) editor with syntax highlighting and
  curated autocomplete.

Drag the divider to resize the two panes. On a narrow screen they stack vertically
instead.

### Choosing a language

Use the language selector to switch between **Python, JavaScript, TypeScript, Java, and
C++**. Each problem comes with starter code for the language you pick and you have to solve it by filling in the methods and then running it against the test cases.

### The timer

Toggle the timer between:

- **Count-up** - see how long an attempt is taking, like a stopwatch.
- **Countdown** - set a target time to simulate interview time pressure.

The timer is drift-corrected, so it stays accurate even if the tab is backgrounded.

## 3. Running your code

Click **Run** to execute your solution against the problem's test cases. You'll get one
of these outcomes per test:

- **Pass** - output matched the expected result.
- **Fail** - it ran but the answer was wrong. A progress bar will show you how many of the total test cases you passed
- **Error** - a compile error, runtime error, or timeout. The message tells you which,
  in plain language.

Your code runs in an isolated sandbox, so infinite loops or crashes only affect your own
run - they time out cleanly rather than breaking anything.

## 4. AI hints & review (optional)

- **Progressive hints.** If you get stuck, hints unlock *after* you've been working for a
  while - they're designed to nudge your thinking and not to just hand over the solution. Each hint
  reveals a little more than the last.
- **Post-solve review.** After you've got a solution, request a review to get feedback on
  correctness and time/space complexity, written the way an interviewer might talk it
  through and you can gain some ideas on a better solution implementation.
- **Free Big-O estimator.** Separately, there's an in-browser complexity estimator that estimates the overall runtime complexity based on the number of loops you have in your implementation.


## 5. Keystroke replay

This is the feature that makes the platform different.

Every edit you make during an attempt is recorded. Afterwards, open **Replay** to watch
your solution rebuild itself keystroke by keystroke:

- **Move** along the timeline to jump to any moment.
- **Change speed** to fast-forward through the boring parts and slow down at the tricky
  ones.

It's the best way to review *how* you solved something - where you paused, backtracked,
or changed approach compare to rather than just whether you passed and solved the problem.

## 6. Saved sessions

When you're signed in, each attempt can be saved as a **session**. From the home page you
can:

- **Edit** - reopen a saved attempt to keep working on it.
- **Replay** - watch the keystroke replay of that attempt.
- **Share** - make that attempt's replay viewable by **anyone with the link**, then
  **Copy link** to share it. Press **Unshare** at any time to make it private again.
- **Delete** - permanently remove an attempt you no longer want (you'll be asked to
  confirm and this can't be undone).

Your sessions are **private to your account by default** - nobody else can see or manage
them. The only exception is a session you explicitly **Share**: while shared, anyone with
its link can view that solution's code and keystroke replay (but not your account
details). Unsharing revokes that access immediately.

## 7. Custom problems

Want to practise something that isn't in the built-in set? You can add your own.

- **Create from a form** - fill in the title, description, starter code, and test cases and then try it for yourself.
- **Import a file** - drag and drop a problem `.json` file straight in and attempt it straight-away with no environment setup needed.
- **Edit in place** - tweak any custom problem after creating it in case you want to add more test cases or misspelt something in the problem description for example.
- **Export** - download any problem as a `.json` file to back it up or share it with
  someone else to challenge them.

Custom problems support the same hidden test harness as the built-in ones, so authoring
one feels just like the real thing and it gives you options to change the format of the required output.

## 8. Accounts & privacy

- **Signing in** unlocks saving sessions, replay history, and custom problems.
- Your data + sessions and custom problems is **private to your account** and isn't
  visible to other users.
- You can delete any saved session at any time.
- You can delete your own account and this erases all connected data

- You can also contact enquiries@codinginterviewpractice.dev for any other concerns/requests


For full details on what's stored and how, see the in-app privacy notice.

---

## Quick FAQ

**Do I need an account?**
No - you can solve and run problems without one. An account does add saving, replay history,
and custom problems though.

**Which languages are supported?**
Python, JavaScript, TypeScript, Java, and C++.

**Is it free?**
Yes as this should be used as a learning tool and should be for the benefit of everyone.

**Why is the AI hint not showing up yet?**
Hints are initially gated and they unlock after you've spent some time on the problem,
so they help when you're genuinely stuck rather than letting you skip the thinking.

**Can other people see my attempts?**
No. Saved sessions and custom problems are private to your account.
