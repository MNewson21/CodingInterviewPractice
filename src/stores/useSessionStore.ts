import { create } from 'zustand';

interface SessionState {
  /** Id of the persisted session for the current attempt, if saved. */
  currentSessionId: string | null;
  saving: boolean;
  setCurrentSessionId: (id: string | null) => void;
  setSaving: (saving: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSessionId: null,
  saving: false,
  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
  setSaving: (saving) => set({ saving }),
}));
