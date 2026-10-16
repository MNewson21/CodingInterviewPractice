/**
 * The first test in this repo that actually RENDERS a component.
 *
 * jsdom is opted into per-file rather than set globally: the other suites are
 * pure-function tests that run in ~0.8s under `environment: 'node'`, and there is no
 * reason to make them pay for a DOM.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock ONLY executeCode, keeping the real runTests / evaluate / compareOutputs and the
// real PistonError (so `instanceof` checks in runTests still hold). The point is to drive
// the genuine judge path through the component without a sandbox: mocking runTests
// instead would let RunPanel drop `problem.judge` on the floor with no test objecting.
vi.mock('./pistonClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./pistonClient')>();
  return { ...actual, executeCode: vi.fn() };
});

import { RunPanel } from './RunPanel';
import { executeCode, PistonError, type PistonResponse, type PistonRunStage } from './pistonClient';
import { useEditorStore } from '../../stores/useEditorStore';
import { useExecutionStore } from '../../stores/useExecutionStore';
import type { Problem } from '../../types/problem';

const mockExecute = executeCode as Mock;

/** A two-case problem whose answers are JSON arrays, so `unordered` can apply at all. */
function problem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: 'letter-combinations',
    title: 'Letter Combinations of a Phone Number',
    difficulty: 'medium',
    tags: ['backtracking'],
    description: '',
    examples: [],
    constraints: [],
    starterCode: {},
    params: [{ name: 'digits', quote: true }],
    testCases: [
      { name: 'two digits', stdin: '23\n', expectedStdout: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' },
      { name: 'no digits', stdin: '\n', expectedStdout: '[]' },
    ],
    ...overrides,
  };
}

function stage(o: Partial<PistonRunStage> = {}): PistonRunStage {
  return { stdout: '', stderr: '', code: 0, signal: null, output: '', ...o };
}

/** Queue one successful Piston response per test case, in order. */
function queueStdout(...stdouts: string[]) {
  for (const stdout of stdouts) {
    mockExecute.mockResolvedValueOnce({ run: stage({ stdout }) } satisfies PistonResponse);
  }
}

// The catalog answer for stdin `23`, and the SAME answer with its top-level items
// reversed - correct under `unordered`, wrong under `exact`.
const CORRECT_23 = '["ad","ae","af","bd","be","bf","cd","ce","cf"]';
const REORDERED_23 = '["cf","ce","cd","bf","be","bd","af","ae","ad"]';

/** Click Run and wait for the async handler to settle (it awaits Piston per test case). */
async function clickRun() {
  fireEvent.click(screen.getByRole('button', { name: /run tests/i }));
  await waitFor(() => expect(useExecutionStore.getState().running).toBe(false));
}

/** Every rendered verdict, in display order - 'pass' | 'fail' | 'error'. */
function verdicts(): string[] {
  return screen.getAllByText(/^(pass|fail|error)$/).map((el) => el.textContent ?? '');
}

beforeEach(() => {
  // The stores are module-level singletons shared by every test in this file.
  useEditorStore.setState({ code: 'print(solve(input()))', language: 'python' });
  useExecutionStore.getState().reset();
  mockExecute.mockReset();
});

afterEach(cleanup);

// ---- the "judged as a set" notice -----------------------------------------
//
// Reachable for the first time since the mode shipped, and never once observed.

describe('the unordered notice', () => {
  it('renders for a problem judged as a set', () => {
    render(<RunPanel problem={problem({ judge: 'unordered' })} />);
    expect(screen.getByText(/judged as a set/i)).toBeDefined();
  });

  it('says that order INSIDE each item still matters', () => {
    render(<RunPanel problem={problem({ judge: 'unordered' })} />);
    // The one constraint the judge cannot enforce has to be stated in the UI.
    expect(screen.getByText(/contents of\s+each item must still be in the order/i)).toBeDefined();
  });

  it('is absent for a problem with no judge mode', () => {
    render(<RunPanel problem={problem()} />);
    expect(screen.queryByText(/judged as a set/i)).toBeNull();
  });

  it('is absent for a problem that declares exact', () => {
    render(<RunPanel problem={problem({ judge: 'exact' })} />);
    expect(screen.queryByText(/judged as a set/i)).toBeNull();
  });
});

// ---- the judge mode reaching the runner -----------------------------------

describe('judging a run through the panel', () => {
  it('accepts a reordered answer when the problem is judged as a set', async () => {
    queueStdout(REORDERED_23, '[]');
    render(<RunPanel problem={problem({ judge: 'unordered' })} />);
    await clickRun();

    expect(screen.getByText('2/2 passed')).toBeDefined();
    expect(verdicts()).toEqual(['pass', 'pass']);
  });

  it('rejects that same answer when the problem is NOT judged as a set', async () => {
    queueStdout(REORDERED_23, '[]');
    render(<RunPanel problem={problem()} />);
    await clickRun();

    // This half is what proves the panel actually threads `problem.judge` through to
    // runTests. Asserting only the acceptance above would pass even if it sent nothing.
    // The empty case still passes: reversing `[]` is a no-op.
    expect(screen.getByText('1/2 passed')).toBeDefined();
    expect(verdicts()).toEqual(['fail', 'pass']);
  });

  it('accepts the canonically ordered answer either way', async () => {
    queueStdout(CORRECT_23, '[]');
    render(<RunPanel problem={problem()} />);
    await clickRun();

    expect(screen.getByText('2/2 passed')).toBeDefined();
  });

  it('shows the expected and actual output of a failing case', async () => {
    queueStdout('["ad"]', '[]');
    render(<RunPanel problem={problem({ judge: 'unordered' })} />);
    await clickRun();

    // A different LENGTH must fail even under the looser mode.
    expect(verdicts()).toEqual(['fail', 'pass']);
    expect(screen.getByText(CORRECT_23)).toBeDefined();
    expect(screen.getByText('["ad"]')).toBeDefined();
  });

  it('names each test case, falling back to a number when unnamed', async () => {
    queueStdout('[]');
    render(
      <RunPanel
        problem={problem({ testCases: [{ stdin: '\n', expectedStdout: '[]' }] })}
      />,
    );
    await clickRun();

    expect(screen.getByText('Test 1')).toBeDefined();
  });
});

// ---- input display --------------------------------------------------------

describe('input display', () => {
  it('labels stdin lines with the problem params', async () => {
    queueStdout(CORRECT_23, '[]');
    render(<RunPanel problem={problem()} />);
    await clickRun();

    expect(screen.getByText('digits="23"')).toBeDefined();
  });

  it('falls back to raw stdin when the problem has no params', async () => {
    queueStdout(CORRECT_23, '[]');
    render(<RunPanel problem={problem({ params: undefined })} />);
    await clickRun();

    expect(screen.getByText('23')).toBeDefined();
    expect(screen.getByText('(none)')).toBeDefined();
  });
});

// ---- failure paths --------------------------------------------------------

describe('failures the solver can act on', () => {
  it('refuses to run empty code without calling Piston', async () => {
    useEditorStore.setState({ code: '   \n' });
    render(<RunPanel problem={problem()} />);
    await clickRun();

    expect(screen.getByText(/write some code before running/i)).toBeDefined();
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('hints at the Piston container when the service is unreachable', async () => {
    mockExecute.mockRejectedValue(new PistonError('unavailable', 'Could not reach the code-execution service.'));
    render(<RunPanel problem={problem()} />);
    await clickRun();

    expect(screen.getByText(/docker start piston/i)).toBeDefined();
  });

  it('tells the solver to wait when rate-limited', async () => {
    mockExecute.mockRejectedValue(new PistonError('rate-limited', 'Code-execution service is rate-limited.'));
    render(<RunPanel problem={problem()} />);
    await clickRun();

    expect(screen.getByText(/wait a few seconds/i)).toBeDefined();
  });

  it('explains a harness name mismatch', async () => {
    mockExecute.mockResolvedValue({
      run: stage({ stderr: "NameError: name 'solve' is not defined", code: 1 }),
    } satisfies PistonResponse);
    render(<RunPanel problem={problem()} />);
    await clickRun();

    expect(verdicts()).toEqual(['error', 'error']);
    expect(screen.getAllByText(/"solve" isn't defined/)[0]).toBeDefined();
  });

  it('prompts for a run before anything has been run', () => {
    render(<RunPanel problem={problem()} />);
    expect(screen.getByText(/run the tests to see results/i)).toBeDefined();
    expect(screen.queryByText(/passed$/)).toBeNull();
  });
});
