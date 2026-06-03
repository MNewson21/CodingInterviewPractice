import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSessions } from './sessions.api';
import { getProblem } from '../problems/problems.data';
import type { SessionRecord } from '../../types/session';

const statusColor: Record<string, string> = {
  solved: 'text-green-400',
  in_progress: 'text-yellow-400',
  abandoned: 'text-zinc-500',
};

export function SessionHistory() {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (error) {
    return <p className="text-xs text-red-400">Could not load sessions: {error}</p>;
  }
  if (!sessions) {
    return <p className="text-xs text-zinc-600">Loading your sessions…</p>;
  }
  if (sessions.length === 0) {
    return <p className="text-xs text-zinc-600">No saved sessions yet.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
      {sessions.map((s) => {
        const title = getProblem(s.problemId)?.title ?? s.problemId;
        const when = new Date(s.createdAt).toLocaleString();
        const replayable = s.keystrokes.length > 0;
        return (
          <li key={s.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <div>
              <span className="font-medium">{title}</span>
              <span className="ml-2 text-xs text-zinc-500">{when}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs uppercase ${statusColor[s.status] ?? 'text-zinc-400'}`}>
                {s.status.replace('_', ' ')}
              </span>
              {replayable && (
                <Link
                  to={`/replay/${s.id}`}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Replay
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
