/**
 * The playhead stops itself at the end by derivation - `playing` is the user's intent,
 * and whether the rAF loop runs is computed from it plus the position - so there is no
 * effect writing `playing` back. This suite pins what that has to keep delivering:
 * playback halts at the end, the button turns into Replay, and Replay restarts from the
 * top rather than toggling playback off.
 *
 * Monaco is stubbed (nothing here touches the model) and rAF is driven by hand, since
 * jsdom never paints and the loop would otherwise never advance.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="replay-editor" />,
}));

import { ReplayPlayer } from './ReplayPlayer';
import type { KeystrokeEvent } from '../../types/session';

/** A single edit a second in, so `totalMs` is 1000. */
const events: KeystrokeEvent[] = [
  { t: 1000, range: { startLine: 1, startCol: 1, endLine: 1, endCol: 1 }, text: 'x', rangeLength: 0 },
];

let frame: FrameRequestCallback | null = null;
let now = 0;

/** Advance the clock and run the pending frame, as a real rAF tick would. */
function tick(ms: number) {
  const cb = frame;
  if (!cb) throw new Error('no animation frame is pending');
  now += ms;
  act(() => cb(now));
}

const playButton = () => screen.getByRole('button', { name: /Play|Pause|Replay/ });
const scrubber = () => screen.getByLabelText('Replay position') as HTMLInputElement;

beforeEach(() => {
  frame = null;
  now = 1_000;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frame = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    frame = null;
  });
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ReplayPlayer', () => {
  it('stops at the end and offers a replay instead of a pause', () => {
    render(<ReplayPlayer events={events} language="python" />);
    expect(playButton().textContent).toBe('Play');

    fireEvent.click(playButton());
    expect(playButton().textContent).toBe('Pause');

    // Part-way through: still playing, with the next frame queued.
    tick(400);
    expect(scrubber().value).toBe('400');
    expect(playButton().textContent).toBe('Pause');
    expect(frame).not.toBeNull();

    // Past the end: the position clamps, the loop is torn down, and the button flips.
    tick(900);
    expect(scrubber().value).toBe('1000');
    expect(playButton().textContent).toBe('Replay');
    expect(frame).toBeNull();
  });

  it('restarts from the top when replayed, rather than toggling playback off', () => {
    render(<ReplayPlayer events={events} language="python" />);
    fireEvent.click(playButton());
    tick(2000);
    expect(playButton().textContent).toBe('Replay');

    fireEvent.click(playButton());
    expect(scrubber().value).toBe('0');
    expect(playButton().textContent).toBe('Pause');
    tick(300);
    expect(scrubber().value).toBe('300');
  });

  it('pauses when the playhead is scrubbed', () => {
    render(<ReplayPlayer events={events} language="python" />);
    fireEvent.click(playButton());

    fireEvent.change(scrubber(), { target: { value: '500' } });
    expect(scrubber().value).toBe('500');
    expect(playButton().textContent).toBe('Play');
  });

  it('says so when there is nothing to replay', () => {
    render(<ReplayPlayer events={[]} language="python" />);
    expect(screen.getByText('No keystrokes were recorded for this session.')).toBeTruthy();
  });
});
