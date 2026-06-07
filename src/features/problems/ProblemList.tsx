import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Difficulty, Problem } from '../../types/problem';
import { useAuth } from '../../lib/auth';
import { listSessions } from '../sessions/sessions.api';

const difficultyColor: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

const DIFFICULTIES: Array<Difficulty | 'all'> = ['all', 'easy', 'medium', 'hard'];

/**
 * The built-in problem catalog with search, difficulty filter, and per-problem
 * solved state. Solved state is derived from the signed-in user's sessions (a
 * problem is "solved" if any of their sessions for it is marked solved); guests
 * see the list without checkmarks.
 */
export function ProblemList({ problems }: { problems: Problem[] }) {
  const { user } = useAuth();
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');

  useEffect(() => {
    if (!user) {
      setSolvedIds(new Set());
      return;
    }
    let cancelled = false;
    listSessions()
      .then((sessions) => {
        if (cancelled) return;
        const solved = new Set(
          sessions.filter((s) => s.status === 'solved').map((s) => s.problemId),
        );
        setSolvedIds(solved);
      })
      .catch(() => {
        // Solved badges are a non-critical enhancement; a failed fetch just shows no badges.
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (difficulty !== 'all' && p.difficulty !== difficulty) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [problems, query, difficulty]);

  const solvedCount = useMemo(
    () => problems.filter((p) => solvedIds.has(p.id)).length,
    [problems, solvedIds],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or tag…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
        />
        <div className="flex items-center gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`rounded-md px-2.5 py-1.5 text-xs capitalize ${
                difficulty === d
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {user && (
        <p className="mb-2 text-xs text-zinc-500">
          {solvedCount} of {problems.length} solved
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          No problems match your search.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {filtered.map((p) => {
            const solved = solvedIds.has(p.id);
            return (
              <li key={p.id}>
                <Link
                  to={`/session/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-xs ${solved ? 'text-green-400' : 'text-transparent'}`}
                      aria-hidden={!solved}
                      title={solved ? 'Solved' : undefined}
                    >
                      ✓
                    </span>
                    <span className="font-medium">{p.title}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {p.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="hidden rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 sm:inline"
                      >
                        {t}
                      </span>
                    ))}
                    <span className={`text-xs uppercase ${difficultyColor[p.difficulty]}`}>
                      {p.difficulty}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
