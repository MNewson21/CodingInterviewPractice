/**
 * The catalog ships in two halves - metadata and a lazily fetched run payload - and this
 * hook is the only thing that joins them back together. These tests run against the real
 * data files, so they also prove the split itself: a built-in problem must come out of
 * the hook with the starter code and test cases a session needs.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('./userProblems.api', () => ({ listUserProblems: vi.fn() }));

import { useProblem } from './useProblem';
import { listUserProblems } from './userProblems.api';
import { useProblemsStore } from '../../stores/useProblemsStore';
import type { Problem } from '../../types/problem';

const mockList = vi.mocked(listUserProblems);

/** A problem the user wrote themselves: stored whole, so it needs no second fetch. */
const customProblem: Problem = {
  id: 'my-own',
  title: 'My Own Problem',
  difficulty: 'easy',
  tags: [],
  description: '',
  examples: [],
  constraints: [],
  starterCode: { python: 'def mine():\n    pass' },
  testCases: [{ stdin: '', expectedStdout: '1' }],
};

beforeEach(() => {
  // The store is a module singleton that latches `loaded`; each test needs it cold.
  useProblemsStore.setState({ custom: [], loaded: false, loading: false, error: null });
  mockList.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useProblem', () => {
  it('joins a built-in problem with its run payload', async () => {
    const { result } = renderHook(() => useProblem('two-sum'));

    // The metadata half is there synchronously - that is what lets the replay header
    // show a title without waiting on the payload fetch.
    expect(result.current.meta?.title).toBe('Two Sum');
    expect(result.current.problem).toBeUndefined();
    expect(result.current.resolving).toBe(true);

    await waitFor(() => expect(result.current.resolving).toBe(false));
    const problem = result.current.problem;
    expect(problem?.title).toBe('Two Sum');
    expect(problem?.starterCode.python).toContain('def');
    expect(problem?.testCases.length).toBeGreaterThan(0);
    expect(problem?.harness?.python).toBeTruthy();
  });

  it('never reports a custom problem missing before its store has loaded', async () => {
    mockList.mockResolvedValue([customProblem]);
    const { result } = renderHook(() => useProblem('my-own'));

    // Not built-in and the store is still in flight: "not found" here would flash a
    // Problem-not-found page at the owner of a perfectly good custom problem.
    expect(result.current.problem).toBeUndefined();
    expect(result.current.resolving).toBe(true);

    await waitFor(() => expect(result.current.problem?.id).toBe('my-own'));
    expect(result.current.resolving).toBe(false);
    expect(result.current.problem?.starterCode.python).toContain('def mine');
  });

  it('settles on not-found for an unknown id once the custom set has loaded', async () => {
    const { result } = renderHook(() => useProblem('no-such-problem'));

    await waitFor(() => expect(result.current.resolving).toBe(false));
    expect(result.current.problem).toBeUndefined();
    expect(result.current.meta).toBeUndefined();
  });

  it('resolves a second problem from the same payload map', async () => {
    const first = renderHook(() => useProblem('two-sum'));
    await waitFor(() => expect(first.result.current.problem).toBeDefined());

    const second = renderHook(() => useProblem('valid-parentheses'));
    await waitFor(() => expect(second.result.current.problem?.id).toBe('valid-parentheses'));
    expect(second.result.current.problem?.testCases.length).toBeGreaterThan(0);
  });

  it('keeps one joined object across re-renders', async () => {
    const { result, rerender } = renderHook(() => useProblem('two-sum'));
    await waitFor(() => expect(result.current.problem).toBeDefined());

    // Callers pass `problem` as an effect dependency, so a re-render must not hand back
    // a fresh object - that would re-run the session page's effects on every render.
    const joined = result.current.problem;
    rerender();
    expect(result.current.problem).toBe(joined);
  });
});
