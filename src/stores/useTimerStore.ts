import { create } from 'zustand';

export type TimerMode = 'countup' | 'countdown';

const DEFAULT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface TimerState {
  mode: TimerMode;
  /** Target length for countdown mode. */
  durationMs: number;
  /** Time accumulated while running (always counts up internally). */
  elapsedMs: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  /** Seed the accumulated time (used when resuming a saved session). */
  setElapsedMs: (elapsedMs: number) => void;
  setMode: (mode: TimerMode) => void;
  setDurationMs: (durationMs: number) => void;
  /** Advance the clock by a measured delta; called by the Timer component. */
  tick: (deltaMs: number) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  mode: 'countup',
  durationMs: DEFAULT_DURATION_MS,
  elapsedMs: 0,
  running: false,
  start: () => set({ running: true }),
  pause: () => set({ running: false }),
  toggle: () => set((s) => ({ running: !s.running })),
  reset: () => set({ elapsedMs: 0, running: false }),
  setElapsedMs: (elapsedMs) => set({ elapsedMs }),
  setMode: (mode) => set({ mode, elapsedMs: 0, running: false }),
  setDurationMs: (durationMs) => set({ durationMs, elapsedMs: 0, running: false }),
  tick: (deltaMs) =>
    set((s) => {
      const elapsedMs = s.elapsedMs + deltaMs;
      // In countdown mode, stop exactly at zero when time runs out.
      if (s.mode === 'countdown' && elapsedMs >= s.durationMs) {
        return { elapsedMs: s.durationMs, running: false };
      }
      return { elapsedMs };
    }),
}));

/** Milliseconds left on a countdown (0 when finished). */
export function selectRemainingMs(s: TimerState): number {
  return Math.max(0, s.durationMs - s.elapsedMs);
}

/** The value to show: remaining for countdown, elapsed for count-up. */
export function selectDisplayMs(s: TimerState): number {
  return s.mode === 'countdown' ? selectRemainingMs(s) : s.elapsedMs;
}
