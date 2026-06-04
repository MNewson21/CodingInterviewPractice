import { create } from 'zustand';
import type { Problem } from '../types/problem';
import { listUserProblems } from '../features/problems/userProblems.api';

interface ProblemsState {
  custom: Problem[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addCustom: (p: Problem) => void;
  updateCustom: (p: Problem) => void;
  removeCustom: (id: string) => void;
}

export const useProblemsStore = create<ProblemsState>((set, get) => ({
  custom: [],
  loaded: false,
  loading: false,
  error: null,
  load: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true, error: null });
    try {
      const custom = await listUserProblems();
      set({ custom, loaded: true });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  addCustom: (p) => set((s) => ({ custom: [p, ...s.custom] })),
  updateCustom: (p) => set((s) => ({ custom: s.custom.map((x) => (x.id === p.id ? p : x)) })),
  removeCustom: (id) => set((s) => ({ custom: s.custom.filter((p) => p.id !== id) })),
}));
