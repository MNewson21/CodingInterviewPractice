import type { Difficulty, Language, Problem } from '../../types/problem';
import type { SessionRecord } from '../../types/session';

export interface DifficultyProgress {
  difficulty: Difficulty;
  solved: number;
  total: number;
}

export interface ProgressStats {
  /** Unique problems with at least one solved session. */
  solvedCount: number;
  /** Unique problems with any session (solved or not). */
  attemptedCount: number;
  /** Total saved sessions across all problems. */
  totalSessions: number;
  /** Summed duration of every session, in milliseconds. */
  totalTimeMs: number;
  /** Solved vs available for each difficulty, in easy → hard order. */
  byDifficulty: DifficultyProgress[];
  /** Languages used, most-used first. */
  byLanguage: { language: Language; count: number }[];
  /** Consecutive days up to today (or yesterday) with at least one session. */
  currentStreakDays: number;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

/** Local-day key (YYYY-MM-DD) so streaks respect the user's timezone, not UTC. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Walk back from today (or yesterday) counting consecutive active days. */
function computeStreak(activeDays: Set<string>): number {
  if (activeDays.size === 0) return 0;
  const cursor = new Date();
  // If there's no activity today, the streak can still be "alive" if it ran up to
  // yesterday - start the count there rather than resetting to zero.
  if (!activeDays.has(dayKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(dayKey(cursor.toISOString()))) return 0;
  }
  let streak = 0;
  while (activeDays.has(dayKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Aggregates a user's saved sessions into the headline numbers shown on the Progress
 * page. Difficulty denominators come from the built-in catalog; solved/attempted counts
 * are by unique problem (a problem solved twice still counts once).
 */
export function computeProgressStats(
  sessions: SessionRecord[],
  catalog: Problem[],
): ProgressStats {
  const solvedIds = new Set<string>();
  const attemptedIds = new Set<string>();
  const activeDays = new Set<string>();
  const languageCounts = new Map<Language, number>();
  let totalTimeMs = 0;

  for (const s of sessions) {
    attemptedIds.add(s.problemId);
    if (s.status === 'solved') solvedIds.add(s.problemId);
    activeDays.add(dayKey(s.createdAt));
    languageCounts.set(s.language, (languageCounts.get(s.language) ?? 0) + 1);
    totalTimeMs += s.durationMs ?? 0;
  }

  const byDifficulty: DifficultyProgress[] = DIFFICULTY_ORDER.map((difficulty) => {
    const inDifficulty = catalog.filter((p) => p.difficulty === difficulty);
    const solved = inDifficulty.filter((p) => solvedIds.has(p.id)).length;
    return { difficulty, solved, total: inDifficulty.length };
  });

  const byLanguage = [...languageCounts.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);

  return {
    solvedCount: solvedIds.size,
    attemptedCount: attemptedIds.size,
    totalSessions: sessions.length,
    totalTimeMs,
    byDifficulty,
    byLanguage,
    currentStreakDays: computeStreak(activeDays),
  };
}

/** Human-friendly duration, e.g. "2h 15m" or "8m" or "-" for zero. */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '-';
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes < 1) return '<1m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
