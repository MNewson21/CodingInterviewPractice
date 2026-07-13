import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { buildSource, normalize, evaluate, runTests } from './testRunner';
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
