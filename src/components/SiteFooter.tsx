import { Link } from 'react-router-dom';
import { SITE } from '../config/site';

/**
 * Shared site footer: attribution, source link, and links to the Revise, About and
 * Privacy pages. Rendered at the bottom of the main public pages to add legitimacy and
 * tie the project to a real person.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
      <p>
        Built by <span className="text-zinc-300">{SITE.author}</span>, a Computer Science student at the
        University of Nottingham.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <a href={SITE.github} target="_blank" rel="noreferrer" className="hover:text-zinc-200">
          GitHub
        </a>
        <Link to="/revise" className="hover:text-zinc-200">
          Revise
        </Link>
        <Link to="/progress" className="hover:text-zinc-200">
          Progress
        </Link>
        <Link to="/about" className="hover:text-zinc-200">
          Why I built this
        </Link>
        <Link to="/privacy" className="hover:text-zinc-200">
          Privacy
        </Link>
        <a href={`mailto:${SITE.email}`} className="hover:text-zinc-200">
          Contact
        </a>
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} {SITE.author} &middot;{' '}
        <a
          href="https://github.com/MNewson21/CodingInterviewPractice/blob/main/LICENSE"
          target="_blank"
          rel="noreferrer"
          className="hover:text-zinc-400"
        >
          MIT licensed
        </a>
      </p>
    </footer>
  );
}
