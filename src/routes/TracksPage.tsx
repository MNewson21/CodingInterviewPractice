import { Link } from 'react-router-dom';
import { ThemeSwitcher } from '../features/editor/ThemeSwitcher';
import { SiteFooter } from '../components/SiteFooter';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../lib/auth';
import { useSolvedIds } from '../features/sessions/useSolvedIds';
import { TRACKS, trackProblems, type Track } from '../features/tracks/tracks.data';

/** One track summary card: title, blurb, problem count, and a solved/total bar for users. */
function TrackCard({ track, solvedIds, showProgress }: {
  track: Track;
  solvedIds: Set<string>;
  showProgress: boolean;
}) {
  const problems = trackProblems(track);
  const total = problems.length;
  const solved = problems.filter((p) => solvedIds.has(p.id)).length;
  const pct = total === 0 ? 0 : Math.round((solved / total) * 100);

  return (
    <Link
      to={`/tracks/${track.id}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={`font-semibold ${track.accent}`}>{track.title}</h3>
        <span className="shrink-0 text-xs text-zinc-500">{total} problems</span>
      </div>
      <p className="mt-1 text-sm text-zinc-400">{track.blurb}</p>
      {showProgress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span>
              {solved} / {total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

/**
 * "Tracks" page: curated study playlists over the existing catalog (Blind 75, Dynamic
 * Programming, etc.). Each card links to a track detail page. Signed-in users see a
 * solved/total progress bar per track; guests see the descriptions and counts. Linked from
 * the home-page header and the footer.
 */
export function TracksPage() {
  usePageTitle('Tracks');
  const { user } = useAuth();
  const solvedIds = useSolvedIds();

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tracks</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Curated problem sets to follow a path instead of picking at random.
            </p>
          </div>
          <Link to="/" className="text-xs text-zinc-400 hover:text-zinc-100">
            ← All problems
          </Link>
        </div>

        <div className="mt-3 flex justify-end">
          <ThemeSwitcher />
        </div>

        {!user && (
          <p className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
            <Link to="/auth" className="text-blue-400 hover:underline">
              Sign in
            </Link>{' '}
            to track your progress through each set.
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {TRACKS.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              solvedIds={solvedIds}
              showProgress={!!user}
            />
          ))}
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
