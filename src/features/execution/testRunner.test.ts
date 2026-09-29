import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { buildSource, normalize, evaluate, compareOutputs, runTests } from './testRunner';
import { executeCode, PistonError, type PistonResponse, type PistonRunStage } from './pistonClient';

// Mock only executeCode; keep the real PistonError so `instanceof` checks in runTests hold.
vi.mock('./pistonClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./pistonClient')>();
  return { ...actual, executeCode: vi.fn() };
});

const mockExecute = executeCode as Mock;

/** Build a PistonResponse, overriding only the run/compile fields a test cares about. */
function response(run: Partial<PistonRunStage>, compile?: Partial<PistonRunStage>): PistonResponse {
  const stage = (o: Partial<PistonRunStage>): PistonRunStage => ({
    stdout: '',
    stderr: '',
    code: 0,
    signal: null,
    output: '',
    ...o,
  });
  return { run: stage(run), ...(compile ? { compile: stage(compile) } : {}) };
}

// ---- buildSource ----------------------------------------------------------

describe('buildSource', () => {
  it('returns the code unchanged when there is no harness', () => {
    expect(buildSource('python', 'print(1)', undefined)).toBe('print(1)');
  });

  it('appends the harness after user code for non-Java languages', () => {
    expect(buildSource('python', 'CODE', 'HARNESS')).toBe('CODE\n\nHARNESS');
  });

  it('puts the harness FIRST for Java (single-file launcher runs the first class)', () => {
    expect(buildSource('java', 'CODE', 'HARNESS')).toBe('HARNESS\n\nCODE');
  });

  it('prepends // @ts-nocheck for TypeScript', () => {
    expect(buildSource('typescript', 'CODE', 'HARNESS')).toBe('// @ts-nocheck\nCODE\n\nHARNESS');
  });
});

// ---- normalize ------------------------------------------------------------

describe('normalize', () => {
  it('converts CRLF to LF', () => {
    expect(normalize('a\r\nb')).toBe('a\nb');
  });

  it('strips trailing whitespace on each line', () => {
    expect(normalize('a   \nb\t')).toBe('a\nb');
  });

  it('strips trailing newlines', () => {
    expect(normalize('result\n\n\n')).toBe('result');
  });

  it('preserves internal blank lines', () => {
    expect(normalize('a\n\nb')).toBe('a\n\nb');
  });

  it('is idempotent', () => {
    const once = normalize('x \r\ny\n');
    expect(normalize(once)).toBe(once);
  });
});

// ---- compareOutputs -------------------------------------------------------

describe('compareOutputs', () => {
  it('defaults to exact comparison', () => {
    expect(compareOutputs('[1,2]', '[1,2]')).toBe(true);
    expect(compareOutputs('[2,1]', '[1,2]')).toBe(false);
  });

  it('normalizes whitespace on both sides before comparing', () => {
    expect(compareOutputs('[1,2]  \r\n', '[1,2]\n')).toBe(true);
  });

  it('exact mode rejects a reordering even when it parses as JSON', () => {
    expect(compareOutputs('[[3],[1,2]]', '[[1,2],[3]]', 'exact')).toBe(false);
  });

  it('unordered mode accepts top-level elements in any order', () => {
    expect(compareOutputs('[[3],[1,2],[]]', '[[],[1,2],[3]]', 'unordered')).toBe(true);
  });

  it('unordered mode keeps order INSIDE an element significant (Permutations)', () => {
    expect(compareOutputs('[[2,1]]', '[[1,2]]', 'unordered')).toBe(false);
  });

  it('unordered mode reorders strings too (Letter Combinations)', () => {
    expect(compareOutputs('["ae","ad"]', '["ad","ae"]', 'unordered')).toBe(true);
  });

  it('unordered mode compares as a MULTISET, not a set (duplicates must match)', () => {
    expect(compareOutputs('[1,1,2]', '[1,2,2]', 'unordered')).toBe(false);
    expect(compareOutputs('[1,1,2]', '[1,2,1]', 'unordered')).toBe(true);
  });

  it('unordered mode rejects a differing element count in BOTH directions', () => {
    expect(compareOutputs('[1,2,3]', '[1,2]', 'unordered')).toBe(false);
    // The short-output direction is the one that needs the explicit length check:
    // a prefix-matching answer would otherwise pass element-by-element.
    expect(compareOutputs('[1,2]', '[1,2,3]', 'unordered')).toBe(false);
  });

  it('unordered mode does not excuse output that is not JSON', () => {
    expect(compareOutputs('Traceback...', '[1,2]', 'unordered')).toBe(false);
  });

  it('unordered mode does not excuse a non-array JSON value', () => {
    // A scalar answer has no top level to reorder; fall back to exact.
    expect(compareOutputs('3', '4', 'unordered')).toBe(false);
    expect(compareOutputs('3', '3', 'unordered')).toBe(true);
  });

  it('unordered mode still passes identical empty output', () => {
    expect(compareOutputs('[]', '[]', 'unordered')).toBe(true);
  });
});

// ---- evaluate -------------------------------------------------------------

describe('evaluate', () => {
  it('passes when normalized stdout matches expected', () => {
    const r = evaluate(response({ stdout: '[0,1]\n' }), '[0,1]');
    expect(r.verdict).toBe('pass');
    expect(r.actual).toBe('[0,1]');
  });

  it('fails when stdout differs from expected', () => {
    expect(evaluate(response({ stdout: '[1,0]' }), '[0,1]').verdict).toBe('fail');
  });

  it('applies the judge mode it is given', () => {
    expect(evaluate(response({ stdout: '[[3],[1,2]]' }), '[[1,2],[3]]').verdict).toBe('fail');
    expect(evaluate(response({ stdout: '[[3],[1,2]]' }), '[[1,2],[3]]', 'unordered').verdict).toBe(
      'pass',
    );
  });

  it('reports a compile failure as error, not wrong answer', () => {
    const r = evaluate(response({ stdout: '' }, { code: 1, stderr: 'boom.cpp:1: error' }), 'x');
    expect(r.verdict).toBe('error');
    expect(r.stderr).toMatch(/error/);
    expect(r.actual).toBe('');
  });

  it('treats a run signal (SIGKILL) as error with a helpful default message', () => {
    const r = evaluate(response({ stdout: '', signal: 'SIGKILL' }), 'x');
    expect(r.verdict).toBe('error');
    expect(r.stderr).toMatch(/timeout or out of memory/i);
  });

  it('treats a non-zero exit code as error', () => {
    const r = evaluate(response({ code: 1, stderr: 'Traceback...' }), 'x');
    expect(r.verdict).toBe('error');
    expect(r.stderr).toBe('Traceback...');
  });
});

// ---- runTests (integration over a mocked Piston) --------------------------

describe('runTests', () => {
  beforeEach(() => mockExecute.mockReset());

  it('combines code + harness once and evaluates each test case', async () => {
    mockExecute
      .mockResolvedValueOnce(response({ stdout: '1' }))
      .mockResolvedValueOnce(response({ stdout: 'WRONG' }));

    const results = await runTests({
      language: 'python',
      code: 'CODE',
      harness: { python: 'HARNESS' },
      testCases: [
        { name: 'case A', stdin: 'a', expectedStdout: '1' },
        { name: 'case B', stdin: 'b', expectedStdout: '2' },
      ],
    });

    expect(results.map((r) => r.verdict)).toEqual(['pass', 'fail']);
    expect(results[0].name).toBe('case A');
    // Harness was combined per buildSource rules and sent to Piston.
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'python', code: 'CODE\n\nHARNESS', stdin: 'a' }),
    );
  });

  it('threads the problem judge mode through to every test case', async () => {
    mockExecute
      .mockResolvedValueOnce(response({ stdout: '[[3],[1,2]]' }))
      .mockResolvedValueOnce(response({ stdout: '[[2,1]]' }));

    const results = await runTests({
      language: 'python',
      code: 'c',
      judge: 'unordered',
      testCases: [
        { stdin: 'a', expectedStdout: '[[1,2],[3]]' },
        { stdin: 'b', expectedStdout: '[[1,2]]' },
      ],
    });

    // Reordered top level passes; a reordered element does not.
    expect(results.map((r) => r.verdict)).toEqual(['pass', 'fail']);
  });

  it('judges exactly when no judge mode is given', async () => {
    mockExecute.mockResolvedValue(response({ stdout: '[[3],[1,2]]' }));
    const results = await runTests({
      language: 'python',
      code: 'c',
      testCases: [{ stdin: 'a', expectedStdout: '[[1,2],[3]]' }],
    });
    expect(results[0].verdict).toBe('fail');
  });

  it('auto-names unnamed test cases "Test N"', async () => {
    mockExecute.mockResolvedValue(response({ stdout: 'x' }));
    const results = await runTests({
      language: 'javascript',
      code: 'c',
      testCases: [{ stdin: '', expectedStdout: 'x' }],
    });
    expect(results[0].name).toBe('Test 1');
  });

  it('records a per-test error row for a generic (runtime) failure', async () => {
    mockExecute.mockRejectedValueOnce(new PistonError('runtime', 'exec 500'));
    const results = await runTests({
      language: 'python',
      code: 'c',
      testCases: [{ stdin: '', expectedStdout: 'x' }],
    });
    expect(results[0].verdict).toBe('error');
    expect(results[0].stderr).toBe('exec 500');
  });

  it('rethrows infrastructure failures (unavailable / rate-limited) instead of per-test rows', async () => {
    // ...Once (lazy) so no eager unhandled-rejection is created for the single call.
    mockExecute.mockRejectedValueOnce(new PistonError('unavailable', 'service down'));
    await expect(
      runTests({
        language: 'python',
        code: 'c',
        testCases: [{ stdin: '', expectedStdout: 'x' }],
      }),
    ).rejects.toThrow(/service down/);
  });
});
