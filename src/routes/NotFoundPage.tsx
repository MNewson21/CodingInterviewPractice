import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { SiteFooter } from '../components/SiteFooter';

/** Catch-all 404 page for unknown routes. */
export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-emerald-400">404</p>
          <h1 className="mt-2 text-2xl font-bold">This page doesn&rsquo;t exist</h1>
          <p className="mt-3 max-w-md text-zinc-400">
            The page you&rsquo;re looking for may have moved or never existed. Let&rsquo;s get you back to the
            problems.
          </p>
          <Link
            to="/"
            className="mt-6 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
          >
            Back to problems
          </Link>
        </div>
        <SiteFooter />
      </div>
    </div>
  );
}
