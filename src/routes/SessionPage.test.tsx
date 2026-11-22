/**
 * The session page is the one place that needs a problem whole - starter code, hidden
 * harness and test cases - and since the catalog split those arrive from a separate
 * fetch. That makes "not found" and "not here yet" two different states, which this
 * suite pins: a real problem must never flash Problem-not-found on its way in.
 *
 * It also pins auto-save, which is wired to RunPanel's onResults rather than to an
 * effect watching the execution store. That wiring has a trap worth a regression test:
 * the callback fires in the same tick the results were stored, so anything reading the
 * verdicts from a render closure sees the PREVIOUS run and saves `in_progress` for a
 * solved attempt.
 *
 * Monaco, auth and the network are stubbed; the catalog is the real one.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

// Signed-in state is per-test, so the auth mock reads a mutable binding rather than
// returning a fixed user.
let authUser: User | null = null;

// The editor is a 50 kB WebAssembly-ish dependency with no bearing on problem loading.
vi.mock('../features/editor/CodeEditor', () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));
vi.mock('../lib/auth', () => ({ useAuth: () => ({ user: authUser, loading: false }) }));
vi.mock('../features/problems/userProblems.api', () => ({ listUserProblems: vi.fn() }));
// The judge itself is covered by RunPanel.test.tsx; here only the verdicts matter.
vi.mock('../features/execution/testRunner', () => ({ runTests: vi.fn() }));
// Keep the real size helpers and AuthRequiredError, stub only the two network writes.
vi.mock('../features/sessions/sessions.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/sessions/sessions.api')>()),
  saveSession: vi.fn(),
  updateSession: vi.fn(),
}));

import { SessionPage } from './SessionPage';
import { listUserProblems } from '../features/problems/userProblems.api';
import { useProblemsStore } from '../stores/useProblemsStore';
import { useExecutionStore } from '../stores/useExecutionStore';
import { useSessionStore } from '../stores/useSessionStore';
import { runTests } from '../features/execution/testRunner';
import type { TestResult } from '../features/execution/testRunner';
import { saveSession } from '../features/sessions/sessions.api';
import type { SessionRecord } from '../types/session';

const mockList = vi.mocked(listUserProblems);
const mockRunTests = vi.mocked(runTests);
const mockSaveSession = vi.mocked(saveSession);

function result(verdict: TestResult['verdict']): TestResult {
  return { name: 'case', verdict, input: '', expected: '', actual: '', stderr: '' };
}

/** Render the page signed in, wait for the problem, then run the tests. */
async function runWithVerdicts(...verdicts: TestResult['verdict'][]) {
  authUser = { id: 'user-1' } as User;
  mockRunTests.mockResolvedValue(verdicts.map(result));
  renderAt('two-sum');
  const run = await waitFor(() => screen.getByRole('button', { name: 'Run tests' }));
  fireEvent.click(run);
}

function renderAt(problemId: string) {
  return render(
    <MemoryRouter initialEntries={[`/session/${problemId}`]}>
      <Routes>
        <Route path="/session/:problemId" element={<SessionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // The page reads matchMedia to decide between the stacked and split layouts.
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
  useProblemsStore.setState({ custom: [], loaded: false, loading: false, error: null });
  // Zustand stores are module singletons, so verdicts and save state leak between tests.
  useExecutionStore.getState().reset();
  useSessionStore.setState({ saving: false, currentSessionId: null });
  authUser = null;
  mockList.mockResolvedValue([]);
  mockSaveSession.mockResolvedValue({ id: 'session-1' } as SessionRecord);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SessionPage', () => {
  it('shows a built-in problem once its run payload has loaded', async () => {
    renderAt('two-sum');

    // Before the payload lands the page is waiting, not empty-handed.
    expect(screen.getByText('Loading…')).toBeTruthy();

    // The title appears twice - the page header and the problem panel.
    await waitFor(() =>
      expect(screen.getAllByRole('heading', { name: 'Two Sum' })).toHaveLength(2),
    );
    expect(screen.getByTestId('code-editor')).toBeTruthy();
    // The run panel is downstream of the test cases, so its presence means the join
    // reached the part of the page that needs the session-only half of the catalog.
    expect(screen.getByRole('button', { name: 'Run tests' })).toBeTruthy();
    expect(screen.queryByText('Problem not found.')).toBeNull();
  });

  it('reports a genuinely unknown problem as not found', async () => {
    renderAt('no-such-problem');

    await waitFor(() => expect(screen.getByText('Problem not found.')).toBeTruthy());
  });

  it('auto-saves an all-pass run as solved, using that run\'s verdicts', async () => {
    await runWithVerdicts('pass', 'pass');

    await waitFor(() => expect(mockSaveSession).toHaveBeenCalledTimes(1));
    // 'solved' is the assertion that matters: 'in_progress' here would mean the save
    // read the verdicts from a stale render instead of the run that just finished.
    expect(mockSaveSession.mock.calls[0][0]).toMatchObject({
      problemId: 'two-sum',
      status: 'solved',
    });
    expect(await screen.findByText('Solved! Progress saved automatically.')).toBeTruthy();
  });

  it('does not auto-save a run that still has a failing case', async () => {
    await runWithVerdicts('pass', 'fail');

    await waitFor(() => expect(screen.getByText('1/2 passed')).toBeTruthy());
    expect(mockSaveSession).not.toHaveBeenCalled();
  });

  it('does not auto-save for a guest', async () => {
    mockRunTests.mockResolvedValue([result('pass')]);
    renderAt('two-sum');
    fireEvent.click(await waitFor(() => screen.getByRole('button', { name: 'Run tests' })));

    await waitFor(() => expect(screen.getByText('1/1 passed')).toBeTruthy());
    expect(mockSaveSession).not.toHaveBeenCalled();
  });
});
