import { Link } from 'react-router-dom';

const features = [
  { title: 'Run real code in-browser', body: 'Solve in Python, JavaScript, or TypeScript and run your code against real test cases - no setup.' },
  { title: 'Replay your keystrokes', body: 'Every attempt is recorded so you can replay exactly how you worked through a problem.' },
  { title: 'AI interview feedback', body: 'Get an AI review of your solution, the way an interviewer would talk through it with you.' },
];

/**
 * Marketing hero shown on the home page to logged-out visitors. Explains the product and
 * invites a no-signup try. `onTryProblem` scrolls down to the problem list (provided by the
 * parent, which owns the list ref).
 */
export function LandingHero({ onTryProblem }: { onTryProblem: () => void }) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 py-10 sm:px-10 sm:py-14">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Practice coding interviews for real.
      </h2>
      <p className="mt-3 max-w-2xl text-zinc-400">
        A mock-interview IDE that runs your code against real tests, replays exactly how you
        solved it, and gives you AI feedback like an interviewer would.
      </p>

      <ul className="mt-8 grid gap-5 sm:grid-cols-3">
        {features.map((f) => (
          <li key={f.title}>
            <h3 className="text-sm font-semibold text-zinc-100">{f.title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{f.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={onTryProblem}
          className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
        >
          Try a problem - no signup
        </button>
        <Link to="/auth" className="text-sm text-zinc-300 hover:text-zinc-100">
          Sign in to save your progress
        </Link>
      </div>
      <p className="mt-3 text-xs text-zinc-500">No account needed to try - sign in only to save your history.</p>
    </section>
  );
}
