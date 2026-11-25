/**
 * ReplayPage is a join: it resolves a session id to a keystroke log over two different
 * fetch paths, resolves the problem id to starter code over a third, and only then hands
 * the three to the player. Nothing else covers that join - `useProblem.test.ts` covers
 * the hook and `ReplayPlayer.test.tsx` covers the transport.
 *
 * The trap worth pinning is the run payload. Starter code is the buffer the recorded
 * edits were made against, and it arrives in the lazily fetched half of the catalog -
 * so mounting the player as soon as the session lands would seed an empty buffer and
 * replay every edit at the wrong offset. The page gates on `resolving` for that reason,
 * and the third test fails if the gate is removed.
 *
 * The player is stubbed to expose what it was handed, which keeps this suite about the
 * page. The catalog metadata is real; only the payload fetch is stubbed, since its
 * timing is the thing under test.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Stand in for the player and report its props, so the assertions can be about what the
// page resolved rather than about playback (which ReplayPlayer.test.tsx already pins).
vi.mock('../features/keystrokes/ReplayPlayer', () => ({
  ReplayPlayer: (props: { events: { t: number }[]; language: string; initialCode?: string }) => (
    <div
      data-testid="replay-player"
      data-language={props.language}
      data-event-times={props.events.map((e) => e.t).join(',')}
      data-initial-code={props.initialCode}
    />
  ),
}));
// Keep the real row mappers; stub only the two reads ReplayPage drives.
vi.mock('../features/sessions/sessions.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/sessions/sessions.api')>()),
  getSharedReplay: vi.fn(),
  getSession: vi.fn(),
}));
// Real `getProblemMeta` (so the header title comes out of the actual catalog), stubbed
// payload fetch - when it resolves is exactly what the loading gate turns on.
vi.mock('../features/problems/problems.data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/problems/problems.data')>()),
  loadProblemRuntime: vi.fn(),
}));
vi.mock('../features/problems/userProblems.api', () => ({ listUserProblems: vi.fn() }));

import { ReplayPage } from './ReplayPage';
import { getSession, getSharedReplay } from '../features/sessions/sessions.api';
import { loadProblemRuntime } from '../features/problems/problems.data';
import { listUserProblems } from '../features/problems/userProblems.api';
import { useProblemsStore } from '../stores/useProblemsStore';
import type { ProblemRuntime } from '../types/problem';
import type { KeystrokeEvent, SessionRecord, SharedReplay } from '../types/session';

const mockShared = vi.mocked(getSharedReplay);
const mockOwn = vi.mocked(getSession);
const mockRuntime = vi.mocked(loadProblemRuntime);
const mockList = vi.mocked(listUserProblems);

const keystrokes: KeystrokeEvent[] = [
  { t: 250, range: { startLine: 1, startCol: 1, endLine: 1, endCol: 1 }, text: 'a', rangeLength: 0 },
  { t: 900, range: { startLine: 1, startCol: 2, endLine: 1, endCol: 2 }, text: 'b', rangeLength: 0 },
];

/** Two languages, so a test can tell "the session's starter code" from "any at all". */
const runtime: ProblemRuntime = {
  starterCode: { python: 'def two_sum():\n    pass', javascript: 'function twoSum() {}' },
  testCases: [{ stdin: '', expectedStdout: '1' }],
};

const sharedReplay: SharedReplay = {
  id: 'session-1',
  problemId: 'two-sum',
  language: 'python',
  code: null,
  status: 'solved',
  durationMs: 1000,
  keystrokes,
  createdAt: '2026-01-01T00:00:00Z',
};

const ownRecord: SessionRecord = {
  ...sharedReplay,
  userId: 'user-1',
  language: 'javascript',
  aiReview: null,
  isPublic: false,
};

const player = () => screen.getByTestId('replay-player');
const title = () => screen.getByRole('heading').textContent;

function renderAt(sessionId: string) {
  return render(
    <MemoryRouter initialEntries={[`/replay/${sessionId}`]}>
      <Routes>
        <Route path="/replay/:sessionId" element={<ReplayPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // The store is a module singleton that latches `loaded`; each test needs it cold,
  // because `resolving` stays true until the custom set has settled.
  useProblemsStore.setState({ custom: [], loaded: false, loading: false, error: null });
  mockList.mockResolvedValue([]);
  mockRuntime.mockResolvedValue(runtime);
  mockShared.mockResolvedValue(null);
  mockOwn.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ReplayPage', () => {
  it('replays a shared session without asking for the owner-only record', async () => {
    mockShared.mockResolvedValue(sharedReplay);

    renderAt('session-1');

    await waitFor(() => expect(player()).toBeTruthy());
    expect(player().getAttribute('data-event-times')).toBe('250,900');
    expect(player().getAttribute('data-language')).toBe('python');
    expect(player().getAttribute('data-initial-code')).toBe(runtime.starterCode.python);
    expect(title()).toBe('Replay - Two Sum');
    // The public path answered, so the owner-only fallback must never be reached - it
    // would 404 for the link-holders this path exists to serve.
    expect(mockOwn).not.toHaveBeenCalled();
    expect(mockShared).toHaveBeenCalledWith('session-1');
  });

  it('falls back to the owner-only record for a session that was never shared', async () => {
    mockShared.mockResolvedValue(null);
    mockOwn.mockResolvedValue(ownRecord);

    renderAt('session-1');

    await waitFor(() => expect(player()).toBeTruthy());
    expect(mockOwn).toHaveBeenCalledWith('session-1');
    // Starter code tracks the language the session was recorded in, not a fixed default.
    expect(player().getAttribute('data-language')).toBe('javascript');
    expect(player().getAttribute('data-initial-code')).toBe(runtime.starterCode.javascript);
  });

  it('waits for the run payload before mounting the player, but shows the title at once', async () => {
    let deliverRuntime!: (r: ProblemRuntime) => void;
    mockRuntime.mockReturnValue(new Promise<ProblemRuntime>((resolve) => (deliverRuntime = resolve)));
    mockShared.mockResolvedValue(sharedReplay);

    renderAt('session-1');

    // The session has landed and the metadata half needs no fetch, so the header is
    // already right - while the buffer the edits were recorded against is still in
    // flight, which is what keeps the player unmounted.
    await waitFor(() => expect(title()).toBe('Replay - Two Sum'));
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByTestId('replay-player')).toBeNull();

    deliverRuntime(runtime);

    await waitFor(() => expect(player()).toBeTruthy());
    expect(player().getAttribute('data-initial-code')).toBe(runtime.starterCode.python);
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('reports a failed lookup instead of an empty player', async () => {
    mockShared.mockRejectedValue(new Error('permission denied for table sessions'));

    renderAt('session-1');

    await waitFor(() =>
      expect(screen.getByText('permission denied for table sessions')).toBeTruthy(),
    );
    expect(screen.queryByTestId('replay-player')).toBeNull();
    expect(screen.queryByText('Session not found.')).toBeNull();
  });

  it('says so when neither path finds the session', async () => {
    renderAt('missing');

    await waitFor(() => expect(screen.getByText('Session not found.')).toBeTruthy());
    expect(screen.queryByTestId('replay-player')).toBeNull();
    // Both paths were tried before giving up.
    expect(mockShared).toHaveBeenCalledWith('missing');
    expect(mockOwn).toHaveBeenCalledWith('missing');
  });
});
