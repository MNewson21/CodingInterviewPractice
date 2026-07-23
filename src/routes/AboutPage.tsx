import { Link } from 'react-router-dom';
import { ThemeSwitcher } from '../features/editor/ThemeSwitcher';
import { SiteFooter } from '../components/SiteFooter';
import { usePageTitle } from '../hooks/usePageTitle';

// Each motivation maps a real reason I built the tool to the feature that answers it.
const motivations = [
  {
    title: 'Learn faster, without being handed the answer',
    body: 'Most practice sites either leave you stuck or just show you the solution. I wanted quick, targeted feedback that nudges me toward the answer so the learning actually sticks.',
    feature: 'Hints + AI feedback that talk through your approach instead of telling you the answer. Language autocomplete to help you code and think faster.',
  },
  {
    title: 'Creating and Solving new problems',
    body: 'I got tired of signing up to yet another site, or hand-writing the boilerplate code and test files just to try one problem. I wanted to be able to drop a single file and start.',
    feature: 'Create, edit, and import/export problems as JSON - no signup to other platforms, no manual scaffolding.',
  },
  {
    title: 'See how I actually got to the answer',
    body: 'The final solution hides the journey. I wanted to watch my own thought process back and revisit earlier attempts to see where I went wrong or right.',
    feature: 'Keystroke replays and a history of previous attempts for every problem.',
  },
  {
    title: 'Practice under interview conditions',
    body: 'Having sat many online coding interviews, I knew that solving a problem and solving it in time are different skills. I wanted to rehearse under pressure and unblock myself fast when stuck.',
    feature: 'A built-in timer and on-demand hints so you can optimise how you practice your problems',
  },
];

/**
 * "Why I built this" page. Explains the personal motivations behind the project
 * and maps each one to the feature that addresses it. Linked from the home page header.
 */
export function AboutPage() {
  usePageTitle('Why I built this');

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">Why did I build this ?</h1>
          <Link to="/" className="text-sm text-blue-400 hover:underline">
            Back to problems
          </Link>
        </div>

        <div className="mt-3 flex justify-end">
          <ThemeSwitcher />
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-lg leading-relaxed text-zinc-300">
            I&rsquo;m a second-year Computer Science student at the{' '}
            <span className="font-semibold text-zinc-100">University of Nottingham</span>. I built
            CodingInterviewPractice for myself as a way to practice coding problems more effectively and not to be given the answer straight away - when I get stuck.
          </p>
          <p className="mt-4 leading-relaxed text-zinc-400">
            Every feature below started as something I personally wished existing tools did
            better. The site is the result of my experience with existing platforms and their caveats
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">What I wanted, and what it became</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {motivations.map((m) => (
              <li
                key={m.title}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
              >
                <h3 className="text-base font-semibold text-zinc-100">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{m.body}</p>
                <p className="mt-3 border-t border-zinc-800 pt-3 text-sm text-emerald-400">
                  {m.feature}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            to="/"
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
          >
            Try a problem
          </Link>
          <Link to="/auth" className="text-sm text-zinc-300 hover:text-zinc-100">
            Sign in to save your progress
          </Link>
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
