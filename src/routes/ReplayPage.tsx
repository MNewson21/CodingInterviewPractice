import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSession, getSharedReplay } from '../features/sessions/sessions.api';
import { useProblem } from '../features/problems/useProblem';
import { ReplayPlayer } from '../features/keystrokes/ReplayPlayer';
import type { Language } from '../types/problem';
import type { KeystrokeEvent } from '../types/session';

/** Minimal shape ReplayPage needs - shared by a public SharedReplay and an owned SessionRecord. */
interface ReplayData {
  problemId: string;
  language: Language;
  keystrokes: KeystrokeEvent[];
}

export function ReplayPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<ReplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    // Try the public path first - it works for anonymous link-holders and for the owner
    // viewing a shared session. Fall back to the owner-only path for the owner's own
    // private (un-shared) sessions, which the public path can't see.
    (async () => {
      try {
        const shared = await getSharedReplay(sessionId);
        if (shared) {
          setSession(shared);
          return;
        }
        const own = await getSession(sessionId);
        setSession(own);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // The player seeds its editor with the problem's starter code, which lives in the
  // lazily fetched run payload - so the replay waits on that as well as on the session.
  // The title comes from the metadata half, which needs no fetch for a built-in problem.
  const { problem, meta, resolving } = useProblem(session?.problemId);
  const title = session ? meta?.title ?? session.problemId : '';
  const ready = !loading && !resolving;

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-100 hover:underline">
          Home
        </Link>
        <h1 className="text-sm font-semibold">{title ? `Replay - ${title}` : 'Replay'}</h1>
        <span className="w-12" />
      </header>

      <div className="min-h-0 flex-1">
        {!ready && <p className="p-4 text-sm text-zinc-500">Loading…</p>}
        {ready && error && <p className="p-4 text-sm text-red-400">{error}</p>}
        {ready && !error && !session && <p className="p-4 text-sm text-zinc-500">Session not found.</p>}
        {ready && session && (
          <ReplayPlayer
            events={session.keystrokes}
            language={session.language}
            initialCode={problem?.starterCode[session.language] ?? ''}
          />
        )}
      </div>
    </div>
  );
}
