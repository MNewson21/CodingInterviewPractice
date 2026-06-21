import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSessions, deleteSession, setSessionPublic } from './sessions.api';
import { problems } from '../problems/problems.data';
import { useProblemsStore } from '../../stores/useProblemsStore';
import type { SessionRecord } from '../../types/session';

const statusColor: Record<string, string> = {
  solved: 'text-green-400',
  in_progress: 'text-yellow-400',
  abandoned: 'text-zinc-500',
};

export function SessionHistory() {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const custom = useProblemsStore((s) => s.custom);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this attempt? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleShare(id: string, next: boolean) {
    setSharingId(id);
    try {
      await setSessionPublic(id, next);
      setSessions((prev) =>
        prev?.map((s) => (s.id === id ? { ...s, isPublic: next } : s)) ?? prev,
      );
      if (next) await copyLink(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSharingId(null);
    }
  }

  async function copyLink(id: string) {
    const url = `${window.location.origin}/replay/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      // Clipboard can be blocked (insecure context / permissions) — show the URL so the
      // user can copy it manually rather than failing silently.
      window.prompt('Copy this replay link:', url);
    }
  }

  function titleFor(problemId: string): string {
    return (
      problems.find((p) => p.id === problemId)?.title ??
      custom.find((p) => p.id === problemId)?.title ??
      problemId
    );
  }

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
        // Locale-neutral format (e.g. "10 Jun 2026, 13:24") to avoid mm/dd vs dd/mm ambiguity.
        const when = new Date(s.createdAt).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const replayable = s.keystrokes.length > 0;
        return (
          <li key={s.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <div>
              <span className="font-medium">{titleFor(s.problemId)}</span>
              <span className="ml-2 text-xs text-zinc-500">{when}</span>
              {s.isPublic && (
                <span className="ml-2 text-xs text-blue-400">• shared</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs uppercase ${statusColor[s.status] ?? 'text-zinc-400'}`}>
                {s.status.replace('_', ' ')}
              </span>
              <Link
                to={`/session/${s.problemId}?session=${s.id}`}
                className="text-xs text-emerald-400 hover:underline"
              >
                Edit
              </Link>
              {replayable && (
                <Link to={`/replay/${s.id}`} className="text-xs text-blue-400 hover:underline">
                  Replay
                </Link>
              )}
              {replayable && s.isPublic && (
                <button
                  type="button"
                  onClick={() => copyLink(s.id)}
                  className="text-xs text-blue-400 hover:underline"
                >
                  {copiedId === s.id ? 'Copied!' : 'Copy link'}
                </button>
              )}
              {replayable && (
                <button
                  type="button"
                  onClick={() => handleToggleShare(s.id, !s.isPublic)}
                  disabled={sharingId === s.id}
                  className="text-xs text-zinc-300 hover:underline disabled:opacity-50"
                >
                  {sharingId === s.id ? '…' : s.isPublic ? 'Unshare' : 'Share'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                disabled={deletingId === s.id}
                className="text-xs text-red-400 hover:underline disabled:opacity-50"
              >
                {deletingId === s.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
