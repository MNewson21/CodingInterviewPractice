import { Link, useParams } from 'react-router-dom';
import { ThemeSwitcher } from '../features/editor/ThemeSwitcher';
import { SiteFooter } from '../components/SiteFooter';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../lib/auth';
import { useSolvedIds } from '../features/sessions/useSolvedIds';
import { getTrack, trackProblems } from '../features/tracks/tracks.data';

const difficultyColor: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

/**
 * Track detail page (`/tracks/:trackId`): the ordered list of problems in one curated
 * track, each linking into a session. Signed-in users see solved ticks and a header count;
 * guests see the list without badges. Unknown track ids render a friendly not-found.
 */
export function TrackDetailPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = trackId ? getTrack(trackId) : undefined;
  usePageTitle(track ? track.title : 'Track not found');
  const { user } = useAuth();
  const solvedIds = useSolvedIds();

  if (!track) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-bold">Track not found</h1>
          <p className="mt-2 text-sm text-zinc-400">
            That track doesn’t exist.{' '}
            <Link to="/tracks" className="text-blue-400 hover:underline">
              Browse all tracks
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const problems = trackProblems(track);
  const solvedCount = problems.filter((p) => solvedIds.has(p.id)).length;

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${track.accent}`}>{track.title}</h1>
            <p className="mt-1 text-sm text-zinc-400">{track.blurb}</p>
          </div>
          <Link to="/tracks" className="text-xs text-zinc-400 hover:text-zinc-100 hover:underline">
            All tracks
          </Link>
        </div>

        <div className="mt-3 flex justify-end">
          <ThemeSwitcher />
        </div>

        <p className="mt-6 mb-2 text-xs text-zinc-500">
          {problems.length} problems{user ? ` · ${solvedCount} solved` : ''}
        </p>

        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {problems.map((p, i) => {
            const solved = solvedIds.has(p.id);
            return (
              <li key={p.id}>
                <Link
                  to={`/session/${p.id}`}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-zinc-900 ${solved ? 'bg-emerald-500/10' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-right text-xs text-zinc-600">{i + 1}</span>
                    <span
                      className={`text-xs ${solved ? 'text-green-400' : 'text-transparent'}`}
                      aria-hidden={!solved}
                      title={solved ? 'Solved' : undefined}
                    >
                      ✓
                    </span>
                    <span className="font-medium">{p.title}</span>
                  </span>
                  <span className={`text-xs uppercase ${difficultyColor[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <SiteFooter />
      </div>
    </div>
  );
}
