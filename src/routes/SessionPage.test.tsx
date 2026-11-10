/**
 * The session page is the one place that needs a problem whole - starter code, hidden
 * harness and test cases - and since the catalog split those arrive from a separate
 * fetch. That makes "not found" and "not here yet" two different states, which this
 * suite pins: a real problem must never flash Problem-not-found on its way in.
 *
 * Monaco, auth and the network are stubbed; the catalog is the real one.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// The editor is a 50 kB WebAssembly-ish dependency with no bearing on problem loading.
vi.mock('../features/editor/CodeEditor', () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));
vi.mock('../lib/auth', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('../features/problems/userProblems.api', () => ({ listUserProblems: vi.fn() }));

import { SessionPage } from './SessionPage';
import { listUserProblems } from '../features/problems/userProblems.api';
import { useProblemsStore } from '../stores/useProblemsStore';

const mockList = vi.mocked(listUserProblems);

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
  mockList.mockResolvedValue([]);
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
});
