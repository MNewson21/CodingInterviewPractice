import { create } from 'zustand';
import type { KeystrokeEvent } from '../types/session';

interface KeystrokeState {
  events: KeystrokeEvent[];
  recording: boolean;
  startTime: number | null;
  /** Wall-clock time of the last keystroke; used by the "stuck" detector. */
  lastActivityAt: number | null;
  startRecording: () => void;
  stopRecording: () => void;
  setStartTime: (t: number) => void;
  appendEvents: (events: KeystrokeEvent[]) => void;
  reset: () => void;
}

export const useKeystrokeStore = create<KeystrokeState>((set) => ({
  events: [],
  recording: false,
  startTime: null,
  lastActivityAt: null,
  startRecording: () => set({ events: [], recording: true, startTime: null, lastActivityAt: null }),
  stopRecording: () => set({ recording: false }),
  setStartTime: (startTime) => set({ startTime }),
  appendEvents: (events) =>
    set((s) => ({ events: [...s.events, ...events], lastActivityAt: Date.now() })),
  reset: () => set({ events: [], recording: false, startTime: null, lastActivityAt: null }),
}));
