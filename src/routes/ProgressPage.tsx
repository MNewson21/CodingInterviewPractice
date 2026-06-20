import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeSwitcher } from '../features/editor/ThemeSwitcher';
import { SiteFooter } from '../components/SiteFooter';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../lib/auth';
import { listSessions } from '../features/sessions/sessions.api';
import { problems } from '../features/problems/problems.data';
import { LANGUAGE_LABELS } from '../lib/languages';
import type { SessionRecord } from '../types/session';
import type { Difficulty } from '../types/problem';
import {
  computeProgressStats,
  formatDuration,
  type DifficultyProgress,
} from '../features/progress/progressStats';

const difficultyBar: Record<Difficulty, string> = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500',
};

/** One headline number with a label, e.g. "12 / 38 · Problems solved". */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{label}</p>
    </div>
  );
}

/** A solved/total bar for a single difficulty. */
function DifficultyRow({ row }: { row: DifficultyProgress }) {
  const pct = row.total === 0 ? 0 : Math.round((row.solved / row.total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="capitalize text-zinc-300">{row.difficulty}</span>
        <span className="text-zinc-500">
          {row.solved} / {row.total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${difficultyBar[row.difficulty]} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * "Progress" page: aggregates the signed-in user's saved sessions into headline stats -
 * problems solved (overall and by difficulty), current daily streak, total practice
 * time, and language mix. Guests see a sign-in prompt. Linked from the home-page header
 * and the footer.
 */
export function ProgressPage() {
  usePageTitle('Progress');
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSessions(null);
      return;
    }
    let cancelled = false;
    listSessions()
      .then((s) => {
        if (!cancelled) setSessions(s);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const stats = useMemo(
    () => (sessions ? computeProgressStats(sessions, problems) : null),
    [sessions],
  );

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your progress</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Solved problems, streak, and practice time from your saved sessions.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link to="/" className="text-sm text-blue-400 hover:underline">
              &larr; Back to problems
            </Link>
            <ThemeSwitcher />
          </div>
        </div>

        <div className="mt-8">
          {authLoading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : !user ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
              <p className="text-sm text-zinc-300">Sign in to see your progress.</p>
              <Link
                to="/auth"
                className="mt-3 inline-block rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Sign in
              </Link>
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">Could not load your progress: {error}</p>
          ) : !stats ? (
            <p className="text-sm text-zinc-500">Loading your sessions…</p>
          ) : stats.totalSessions === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
              <p className="text-sm text-zinc-300">No saved sessions yet.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Solve a problem and save it to start tracking your progress.
              </p>
              <Link
                to="/"
                className="mt-3 inline-block rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Pick a problem
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  value={`${stats.solvedCount} / ${problems.length}`}
                  label="Problems solved"
                />
                <StatCard
                  value={`${stats.currentStreakDays}${stats.currentStreakDays === 1 ? ' day' : ' days'}`}
                  label="Current streak"
                />
                <StatCard value={formatDuration(stats.totalTimeMs)} label="Time practising" />
                <StatCard value={String(stats.totalSessions)} label="Sessions saved" />
              </section>

              <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <h2 className="mb-4 text-sm font-semibold text-zinc-300">By difficulty</h2>
                <div className="space-y-4">
                  {stats.byDifficulty.map((row) => (
                    <DifficultyRow key={row.difficulty} row={row} />
                  ))}
                </div>
              </section>

              {stats.byLanguage.length > 0 && (
                <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <h2 className="mb-4 text-sm font-semibold text-zinc-300">Most frequent languages used across sessions</h2>
                  <ul className="flex flex-wrap gap-2">
                    {stats.byLanguage.map((l) => (
                      <li
                        key={l.language}
                        className="rounded-md bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
                      >
                        {LANGUAGE_LABELS[l.language]}
                        <span className="ml-1.5 text-xs text-zinc-500">{l.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="text-xs text-zinc-500">
                {stats.attemptedCount} of {problems.length} problems attempted.{' '}
                <Link to="/" className="text-blue-400 hover:underline">
                  Keep going &rarr;
                </Link>
              </p>
            </div>
          )}
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
