import { create } from 'zustand';
import type { KeystrokeEvent } from '../types/session';

interface KeystrokeState {
  events: KeystrokeEvent[];
  recording: boolean;
  /** Baseline for relative timestamps; set lazily on the first real keystroke. */
  startTime: number | null;
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
  startRecording: () => set({ events: [], recording: true, startTime: null }),
  stopRecording: () => set({ recording: false }),
  setStartTime: (startTime) => set({ startTime }),
  appendEvents: (events) => set((s) => ({ events: [...s.events, ...events] })),
  reset: () => set({ events: [], recording: false, startTime: null }),
}));
