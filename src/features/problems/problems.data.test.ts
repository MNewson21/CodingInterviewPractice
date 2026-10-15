import { describe, it, expect, vi } from 'vitest';

// problems.data -> useProblemsStore -> userProblems.api -> supabaseClient, whose
// createClient() call needs a WebSocket global that Node 20 does not expose. None of that
// is under test here - these are static assertions about the shipped catalog - so the
// client is stubbed to keep the import chain from constructing a realtime socket.
vi.mock('../../lib/supabaseClient', () => ({
  isSupabaseConfigured: false,
  supabase: {},
}));

import { problems } from './problems.data';
import { compareOutputs } from '../execution/testRunner';

describe('built-in catalog', () => {
  it('has unique problem ids', () => {
    const ids = problems.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares only judge modes the runner understands', () => {
    const bad = problems.filter((p) => p.judge !== undefined && p.judge !== 'exact' && p.judge !== 'unordered');
    expect(bad.map((p) => p.id)).toEqual([]);
  });
});

/**
 * `compareOutputs` falls back to exact comparison when either side is not a JSON array, so
 * a problem that asks for `unordered` while printing something else is not an error - the
 * mode just silently does nothing, and the problem looks judged-as-a-set when it is not.
 * These assertions make that failure loud instead.
 */
describe('problems judged as unordered', () => {
  const unordered = problems.filter((p) => p.judge === 'unordered');

  it('exist at all (the mode is wired to the catalog, not just to the runner)', () => {
    expect(unordered.length).toBeGreaterThan(0);
  });

  it.each(unordered.map((p) => [p.id, p] as const))(
    '%s: every expected output is a JSON array, so the mode actually applies',
    (_id, problem) => {
      for (const tc of problem.testCases) {
        const parsed: unknown = JSON.parse(tc.expectedStdout.trim());
        expect(Array.isArray(parsed)).toBe(true);
      }
    },
  );

  it.each(unordered.map((p) => [p.id, p] as const))(
    '%s: a reordered expected output is still accepted',
    (_id, problem) => {
      for (const tc of problem.testCases) {
        const items = JSON.parse(tc.expectedStdout.trim()) as unknown[];
        if (items.length < 2) continue;
        const reversed = JSON.stringify([...items].reverse());
        expect(compareOutputs(reversed, tc.expectedStdout, problem.judge)).toBe(true);
        // ...and the same output is rejected under the default mode, which is what proves
        // the declared mode is load-bearing rather than decorative.
        expect(compareOutputs(reversed, tc.expectedStdout)).toBe(false);
      }
    },
  );

  it.each(unordered.map((p) => [p.id, p] as const))(
    '%s: dropping an item is still rejected',
    (_id, problem) => {
      for (const tc of problem.testCases) {
        const items = JSON.parse(tc.expectedStdout.trim()) as unknown[];
        if (items.length === 0) continue;
        const short = JSON.stringify(items.slice(0, -1));
        expect(compareOutputs(short, tc.expectedStdout, problem.judge)).toBe(false);
      }
    },
  );
});

/**
 * The expected outputs in problems.json are computed by scripts/add-problems.py and then
 * never re-checked, so a hand-edit that drops or mistypes an item would make the problem
 * permanently unsolvable with no test objecting. These assertions re-derive the keypad
 * rule and check the shipped answers against it WITHOUT re-implementing the enumeration,
 * so they stay an independent check rather than a copy of the solution.
 */
describe('letter-combinations expected outputs obey the keypad rule', () => {
  // Standard phone keypad: a-z handed out in order across keys 2-9, three letters per
  // key except 7 and 9, which take four. Derived rather than copied from the catalog.
  const sizes: Record<string, number> = { '2': 3, '3': 3, '4': 3, '5': 3, '6': 3, '7': 4, '8': 3, '9': 4 };
  const pad: Record<string, string> = {};
  let cursor = 0;
  for (const key of Object.keys(sizes)) {
    pad[key] = 'abcdefghijklmnopqrstuvwxyz'.slice(cursor, cursor + sizes[key]);
    cursor += sizes[key];
  }

  it('allocates the whole alphabet across keys 2-9', () => {
    expect(cursor).toBe(26);
    expect(pad['2']).toBe('abc');
    expect(pad['7']).toBe('pqrs');
    expect(pad['9']).toBe('wxyz');
  });

  const problem = problems.find((p) => p.id === 'letter-combinations');

  it('is in the catalog and judged as a set', () => {
    expect(problem).toBeDefined();
    expect(problem!.judge).toBe('unordered');
  });

  it.each((problem?.testCases ?? []).map((tc) => [tc.name ?? tc.stdin, tc] as const))(
    '%s',
    (_name, tc) => {
      const digits = tc.stdin.trim();
      const items = JSON.parse(tc.expectedStdout.trim()) as string[];

      // Count: the product of the key sizes, and empty input spells nothing at all.
      const expectedCount = digits === '' ? 0 : [...digits].reduce((n, d) => n * sizes[d], 1);
      expect(items).toHaveLength(expectedCount);

      // No duplicates, and every combination is exactly as long as the digit string.
      expect(new Set(items).size).toBe(items.length);
      expect(items.every((c) => c.length === digits.length)).toBe(true);

      // Position i must draw exactly the letters on digit i's key - this is what pins the
      // per-element order the `unordered` mode deliberately does not check.
      [...digits].forEach((d, i) => {
        expect([...new Set(items.map((c) => c[i]))].sort().join('')).toBe(pad[d]);
      });
    },
  );
});
