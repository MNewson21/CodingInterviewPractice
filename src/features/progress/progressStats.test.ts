import { describe, it, expect } from 'vitest';
import { computeProgressStats, formatDuration } from './progressStats';
import type { Problem } from '../../types/problem';
import type { SessionRecord } from '../../types/session';

// ---- fixtures -------------------------------------------------------------

/** A session record with sensible defaults; override only what a test cares about. */
function session(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'sess-1',
    userId: 'user-1',
    problemId: 'two-sum',
    language: 'python',
    code: 'print(1)',
    status: 'solved',
    durationMs: 60_000,
    keystrokes: [],
    aiReview: null,
    createdAt: new Date().toISOString(),
    isPublic: false,
    ...overrides,
  };
}

/** A catalog problem stub — only id/difficulty matter to the stats aggregator. */
function problem(id: string, difficulty: Problem['difficulty']): Problem {
  return {
    id,
    title: id,
    difficulty,
    tags: [],
    description: '',
    examples: [],
    constraints: [],
    starterCode: {},
    testCases: [{ stdin: '', expectedStdout: '' }],
  };
}

/** ISO timestamp for local noon `n` days ago (noon dodges DST/timezone day-boundary flakiness). */
function daysAgoIso(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const CATALOG: Problem[] = [
  problem('easy-1', 'easy'),
  problem('easy-2', 'easy'),
  problem('med-1', 'medium'),
  problem('hard-1', 'hard'),
];

// ---- computeProgressStats -------------------------------------------------

describe('computeProgressStats', () => {
  it('returns all-zero stats for no sessions', () => {
    const stats = computeProgressStats([], CATALOG);
    expect(stats.solvedCount).toBe(0);
    expect(stats.attemptedCount).toBe(0);
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalTimeMs).toBe(0);
    expect(stats.byLanguage).toEqual([]);
    expect(stats.currentStreakDays).toBe(0);
  });

  it('still reports difficulty denominators from the catalog when there are no sessions', () => {
    const stats = computeProgressStats([], CATALOG);
    expect(stats.byDifficulty).toEqual([
      { difficulty: 'easy', solved: 0, total: 2 },
      { difficulty: 'medium', solved: 0, total: 1 },
      { difficulty: 'hard', solved: 0, total: 1 },
    ]);
  });

  it('counts a solved problem once even across repeated sessions', () => {
    const stats = computeProgressStats(
      [
        session({ problemId: 'easy-1', status: 'solved' }),
        session({ problemId: 'easy-1', status: 'solved' }),
      ],
      CATALOG,
    );
    expect(stats.solvedCount).toBe(1);
    expect(stats.attemptedCount).toBe(1);
    expect(stats.totalSessions).toBe(2);
  });

  it('distinguishes attempted (any status) from solved', () => {
    const stats = computeProgressStats(
      [
        session({ problemId: 'easy-1', status: 'in_progress' }),
        session({ problemId: 'med-1', status: 'solved' }),
      ],
      CATALOG,
    );
    expect(stats.attemptedCount).toBe(2);
    expect(stats.solvedCount).toBe(1);
  });

  it('tallies solved-by-difficulty against catalog totals', () => {
    const stats = computeProgressStats(
      [
        session({ problemId: 'easy-1', status: 'solved' }),
        session({ problemId: 'hard-1', status: 'solved' }),
      ],
      CATALOG,
    );
    expect(stats.byDifficulty).toEqual([
      { difficulty: 'easy', solved: 1, total: 2 },
      { difficulty: 'medium', solved: 0, total: 1 },
      { difficulty: 'hard', solved: 1, total: 1 },
    ]);
  });

  it('sums duration across sessions, treating null duration as zero', () => {
    const stats = computeProgressStats(
      [
        session({ durationMs: 1000 }),
        session({ durationMs: null }),
        session({ durationMs: 500 }),
      ],
      CATALOG,
    );
    expect(stats.totalTimeMs).toBe(1500);
  });

  it('ranks languages by usage, most-used first', () => {
    const stats = computeProgressStats(
      [
        session({ language: 'python' }),
        session({ language: 'python' }),
        session({ language: 'javascript' }),
      ],
      CATALOG,
    );
    expect(stats.byLanguage).toEqual([
      { language: 'python', count: 2 },
      { language: 'javascript', count: 1 },
    ]);
  });
});

describe('computeProgressStats — streaks', () => {
  it('counts a streak that includes today', () => {
    const stats = computeProgressStats(
      [session({ createdAt: daysAgoIso(0) }), session({ createdAt: daysAgoIso(1) })],
      CATALOG,
    );
    expect(stats.currentStreakDays).toBe(2);
  });

  it('keeps a streak alive when the most recent activity was yesterday', () => {
    const stats = computeProgressStats(
      [session({ createdAt: daysAgoIso(1) }), session({ createdAt: daysAgoIso(2) })],
      CATALOG,
    );
    expect(stats.currentStreakDays).toBe(2);
  });

  it('resets to zero when the last activity was two or more days ago', () => {
    const stats = computeProgressStats([session({ createdAt: daysAgoIso(2) })], CATALOG);
    expect(stats.currentStreakDays).toBe(0);
  });

  it('stops counting at the first gap in the run of days', () => {
    const stats = computeProgressStats(
      [
        session({ createdAt: daysAgoIso(0) }),
        session({ createdAt: daysAgoIso(1) }),
        // gap at day 2
        session({ createdAt: daysAgoIso(3) }),
      ],
      CATALOG,
    );
    expect(stats.currentStreakDays).toBe(2);
  });

  it('counts multiple sessions on the same day as a single streak day', () => {
    const stats = computeProgressStats(
      [session({ createdAt: daysAgoIso(0) }), session({ createdAt: daysAgoIso(0) })],
      CATALOG,
    );
    expect(stats.currentStreakDays).toBe(1);
  });
});

// ---- formatDuration -------------------------------------------------------

describe('formatDuration', () => {
  it.each([
    [0, '-'],
    [-5, '-'],
    [20_000, '<1m'], // 20s rounds to 0min -> "<1m" (30s would round up to "1m")
    [60_000, '1m'],
    [8 * 60_000, '8m'],
    [60 * 60_000, '1h'],
    [(2 * 60 + 15) * 60_000, '2h 15m'],
    [3 * 60 * 60_000, '3h'],
  ] as const)('formats %ims as "%s"', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });

  it('rounds to the nearest minute', () => {
    expect(formatDuration(89_000)).toBe('1m'); // 1m29s -> 1m
    expect(formatDuration(90_000)).toBe('2m'); // 1m30s -> 2m
    expect(formatDuration(88_000)).toBe('1m') // just checking the rounding so no accidental truncating occurs
  });
});
