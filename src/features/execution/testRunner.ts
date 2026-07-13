import type { Language, TestCase } from '../../types/problem';
import { executeCode, PistonError, type PistonResponse } from './pistonClient';

export type Verdict = 'pass' | 'fail' | 'error';

export interface TestResult {
  name: string;
  verdict: Verdict;
  input: string;
  expected: string;
  actual: string;
  stderr: string;
}

/**
 * Combine the user's code with the problem's hidden harness.
 * The harness is appended so the user's function is in scope; for
 * TypeScript we prepend `// @ts-nocheck` so the harness's Node `require` compiles.
 *
 * Java is the exception: Piston runs it via the single-file source launcher
 * (`java Main.java`), which executes the FIRST top-level class in the file - so
 * the harness (`public class Main` with `main`) must come first, with its imports
 * at the very top, and the user's `class Solution` follows (forward reference is
 * fine). The harness pre-imports `java.util.*`, so user code must not add imports.
 * 
 * This is to test the code btw
 */
export function buildSource(
  language: Language,
  code: string,
  harness: string | undefined,
): string {
  if (!harness) return code;
  if (language === 'java') return `${harness}\n\n${code}`;
  const combined = `${code}\n\n${harness}`;
  return language === 'typescript' ? `// @ts-nocheck\n${combined}` : combined;
}

/** Tolerant comparison: normalise newlines and trailing whitespace. */
export function normalize(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

export function evaluate(
  response: PistonResponse,
  expected: string,
): { verdict: Verdict; actual: string; stderr: string } {
  // A compile failure (Java/C++/TS) is reported as an error, not a wrong answer.
  if (response.compile && response.compile.code !== 0) {
    return { verdict: 'error', actual: '', stderr: response.compile.stderr };
  }

  const run = response.run;
  const actual = normalize(run.stdout);

  // Piston kills runs that exceed the time/memory limit; it reports a signal (e.g. SIGKILL).
  if (run.signal) {
    return {
      verdict: 'error',
      actual,
      stderr: run.stderr || `Killed (${run.signal}) - likely a timeout or out of memory.`,
    };
  }

  if (run.code !== 0) {
    return { verdict: 'error', actual, stderr: run.stderr || `exited with code ${run.code}` };
  }

  return {
    verdict: actual === normalize(expected) ? 'pass' : 'fail',
    actual,
    stderr: run.stderr || '',
  };
}

export async function runTests(params: {
  language: Language;
  code: string;
  testCases: TestCase[];
  harness?: Partial<Record<Language, string>>;
}): Promise<TestResult[]> {
  const { language, code, testCases, harness } = params;
  const source = buildSource(language, code, harness?.[language]);
  const results: TestResult[] = [];

  // Run sequentially: the public Piston endpoint is rate-limited (~5 req/s).
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const name = tc.name ?? `Test ${i + 1}`;
    try {
      const response = await executeCode({ language, code: source, stdin: tc.stdin });
      const { verdict, actual, stderr } = evaluate(response, tc.expectedStdout);
      results.push({ name, verdict, input: tc.stdin, expected: normalize(tc.expectedStdout), actual, stderr });
    } catch (err) {
      // Infrastructure failures (service down / rate-limited) hit every test the same
      // way - surface them once to the caller instead of as N identical per-test rows.
      if (err instanceof PistonError && (err.kind === 'unavailable' || err.kind === 'rate-limited')) {
        throw err;
      }
      results.push({
        name,
        verdict: 'error',
        input: tc.stdin,
        expected: normalize(tc.expectedStdout),
        actual: '',
        stderr: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
