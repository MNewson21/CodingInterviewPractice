import { Link } from 'react-router-dom';
import { Markdown } from '../components/Markdown';
import { SiteFooter } from '../components/SiteFooter';
import { usePageTitle } from '../hooks/usePageTitle';
import { PRIVACY_NOTICE } from '../content/privacyNotice';

/** Renders the privacy notice at /privacy, linked from the footer. */
export function PrivacyPage() {
  usePageTitle('Privacy');
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">Privacy Notice</h1>
          <Link to="/" className="text-sm text-blue-400 hover:underline">
            &larr; Back to problems
          </Link>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-8 sm:px-8">
          <Markdown>{PRIVACY_NOTICE}</Markdown>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
