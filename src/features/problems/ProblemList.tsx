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

type Status = 'all' | 'unsolved' | 'solved';
const STATUSES: Status[] = ['all', 'unsolved', 'solved'];

/**
 * The built-in problem catalog with search, difficulty filter, tag filter,
 * solved-status filter, and per-problem solved state. Solved state is derived
 * from the signed-in user's sessions (a problem is "solved" if any of their
 * sessions for it is marked solved); guests see the list without checkmarks
 * and without the status filter.
 */
export function ProblemList({ problems }: { problems: Problem[] }) {
  const { user } = useAuth();
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showTags, setShowTags] = useState(false);
  const [status, setStatus] = useState<Status>('all');

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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const p of problems) for (const t of p.tags) tags.add(t);
    return [...tags].sort();
  }, [problems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (difficulty !== 'all' && p.difficulty !== difficulty) return false;
      if (status === 'solved' && !solvedIds.has(p.id)) return false;
      if (status === 'unsolved' && solvedIds.has(p.id)) return false;
      // Tag filter is AND: a problem must carry every selected tag.
      if (selectedTags.size > 0 && ![...selectedTags].every((t) => p.tags.includes(t)))
        return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [problems, query, difficulty, status, selectedTags, solvedIds]);

  const solvedCount = useMemo(
    () => problems.filter((p) => solvedIds.has(p.id)).length,
    [problems, solvedIds],
  );

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });

  const hasActiveFilters =
    query.trim() !== '' || difficulty !== 'all' || status !== 'all' || selectedTags.size > 0;

  const clearFilters = () => {
    setQuery('');
    setDifficulty('all');
    setStatus('all');
    setSelectedTags(new Set());
  };

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
        <button
          type="button"
          onClick={() => setShowTags((s) => !s)}
          className={`rounded-md px-2.5 py-1.5 text-xs ${
            selectedTags.size > 0
              ? 'bg-zinc-700 text-zinc-100'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
          aria-expanded={showTags}
        >
          Tags{selectedTags.size > 0 ? ` (${selectedTags.size})` : ''} {showTags ? '▾' : '▸'}
        </button>
      </div>

      {user && (
        <div className="mb-2 flex items-center gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-md px-2.5 py-1.5 text-xs capitalize ${
                status === s
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {showTags && (
        <div className="mb-3 flex flex-wrap gap-1.5 rounded-lg border border-zinc-800 p-2">
          {allTags.map((t) => {
            const active = selectedTags.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                aria-pressed={active}
                className={`rounded px-2 py-0.5 text-xs ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-2 flex items-center gap-3 text-xs text-zinc-500">
        <span>
          Showing {filtered.length} of {problems.length}
          {user ? ` · ${solvedCount} solved` : ''}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

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
                  className={`flex items-center justify-between px-4 py-3 hover:bg-zinc-900 ${solved ? 'bg-emerald-500/10' : ''}`}
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
