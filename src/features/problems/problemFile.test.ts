import { describe, it, expect } from 'vitest';
import { parseProblemData, buildProblemFile, PROBLEM_SCHEMA_VERSION } from './problemFile';
import type { Problem } from '../../types/problem';

/** The minimal object that parses cleanly; spread over it to craft invalid variants. */
function validRaw(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    description: 'Return indices of the two numbers that add up to target.',
    examples: [{ input: '[2,7], 9', output: '[0,1]' }],
    constraints: ['2 <= n <= 1000'],
    starterCode: { python: 'def two_sum(nums, target):\n    pass' },
    harness: { python: 'print(two_sum(a, b))' },
    params: [{ name: 'nums' }, { name: 'target' }],
    testCases: [{ stdin: '[2,7]\n9', expectedStdout: '[0,1]' }],
    ...overrides,
  };
}

const parse = (obj: unknown) => parseProblemData(JSON.stringify(obj));

describe('parseProblemData — structural validation', () => {
  it('rejects non-JSON text', () => {
    expect(() => parseProblemData('{ not json')).toThrow(/not valid json/i);
  });

  it('rejects a JSON value that is not an object', () => {
    expect(() => parseProblemData('42')).toThrow(/must be a JSON object/i);
    expect(() => parseProblemData('null')).toThrow(/must be a JSON object/i);
  });

  it('requires a title', () => {
    const { title: _omit, ...noTitle } = validRaw();
    expect(() => parse(noTitle)).toThrow(/title/i);
  });

  it('rejects a whitespace-only title', () => {
    expect(() => parse(validRaw({ title: '   ' }))).toThrow(/"title" is required/i);
  });

  it('rejects an over-long title', () => {
    expect(() => parse(validRaw({ title: 'x'.repeat(201) }))).toThrow(/too long/i);
  });

  it('rejects a non-string title', () => {
    expect(() => parse(validRaw({ title: 123 }))).toThrow(/must be a string/i);
  });
});

describe('parseProblemData — testCases', () => {
  it('requires a non-empty testCases array', () => {
    const { testCases: _omit, ...noTc } = validRaw();
    expect(() => parse(noTc)).toThrow(/non-empty array/i);
    expect(() => parse(validRaw({ testCases: [] }))).toThrow(/non-empty array/i);
  });

  it('rejects more than 50 test cases', () => {
    const many = Array.from({ length: 51 }, () => ({ stdin: '', expectedStdout: 'x' }));
    expect(() => parse(validRaw({ testCases: many }))).toThrow(/too many test cases/i);
  });

  it('requires expectedStdout on each test case', () => {
    expect(() => parse(validRaw({ testCases: [{ stdin: '1' }] }))).toThrow(/expectedStdout/i);
  });

  it('defaults a missing stdin to empty string', () => {
    const data = parse(validRaw({ testCases: [{ expectedStdout: 'ok' }] }));
    expect(data.testCases[0]).toEqual({ stdin: '', expectedStdout: 'ok' });
  });
});

describe('parseProblemData — normalization & defaults', () => {
  it('defaults an invalid/missing difficulty to "medium"', () => {
    expect(parse(validRaw({ difficulty: 'impossible' })).difficulty).toBe('medium');
    const { difficulty: _omit, ...noDiff } = validRaw();
    expect(parse(noDiff).difficulty).toBe('medium');
  });

  it('keeps a valid difficulty', () => {
    expect(parse(validRaw({ difficulty: 'hard' })).difficulty).toBe('hard');
  });

  it('trims the title', () => {
    expect(parse(validRaw({ title: '  Padded  ' })).title).toBe('Padded');
  });

  it('drops non-string tags and caps at 20', () => {
    const tags = [...Array(25).keys()].map(String).concat([1, null, {}] as unknown as string[]);
    const data = parse(validRaw({ tags }));
    expect(data.tags).toHaveLength(20);
    expect(data.tags.every((t) => typeof t === 'string')).toBe(true);
  });

  it('parses a full valid problem into normalized data', () => {
    const data = parse(validRaw());
    expect(data).toMatchObject({
      title: 'Two Sum',
      difficulty: 'easy',
      tags: ['array', 'hash-table'],
      starterCode: { python: expect.stringContaining('def two_sum') },
      harness: { python: expect.stringContaining('print(') },
      params: [{ name: 'nums' }, { name: 'target' }],
    });
    expect(data.testCases).toEqual([{ stdin: '[2,7]\n9', expectedStdout: '[0,1]' }]);
    // ProblemData is the id-less shape.
    expect('id' in data).toBe(false);
  });

  it('omits the harness key entirely when no harness is provided', () => {
    const { harness: _omit, ...noHarness } = validRaw();
    const data = parse(noHarness);
    expect('harness' in data).toBe(false);
  });

  it('requires a name on each declared param', () => {
    expect(() => parse(validRaw({ params: [{ quote: true }] }))).toThrow(/name/i);
  });
});

describe('buildProblemFile', () => {
  const problem: Problem = {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array'],
    description: 'desc',
    examples: [],
    constraints: [],
    starterCode: { python: 'pass' },
    testCases: [{ stdin: '', expectedStdout: '1' }],
  };

  it('strips the id and stamps the schema version', () => {
    const parsed = JSON.parse(buildProblemFile(problem));
    expect(parsed.schemaVersion).toBe(PROBLEM_SCHEMA_VERSION);
    expect(parsed.id).toBeUndefined();
    expect(parsed.title).toBe('Two Sum');
  });

  it('round-trips back through parseProblemData without loss of core fields', () => {
    const reparsed = parseProblemData(buildProblemFile(problem));
    expect(reparsed.title).toBe(problem.title);
    expect(reparsed.difficulty).toBe(problem.difficulty);
    expect(reparsed.testCases).toEqual(problem.testCases);
  });
});
