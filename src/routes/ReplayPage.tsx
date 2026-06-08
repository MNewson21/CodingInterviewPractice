import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSession } from '../features/sessions/sessions.api';
import { problems } from '../features/problems/problems.data';
import { ReplayPlayer } from '../features/keystrokes/ReplayPlayer';
import { useProblemsStore } from '../stores/useProblemsStore';
import type { SessionRecord } from '../types/session';

export function ReplayPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const custom = useProblemsStore((s) => s.custom);
  const customLoaded = useProblemsStore((s) => s.loaded);
  const loadCustom = useProblemsStore((s) => s.load);
  useEffect(() => {
    loadCustom();
  }, [loadCustom]);

  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId)
      .then(setSession)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const problem = session
    ? problems.find((p) => p.id === session.problemId) ??
      custom.find((p) => p.id === session.problemId)
    : undefined;
  const title = session ? problem?.title ?? session.problemId : '';
  const ready = !loading && customLoaded;

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-100">
          &larr; Home
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
