import { create } from 'zustand';
import type { TestResult } from '../features/execution/testRunner';

interface ExecutionState {
  running: boolean;
  results: TestResult[] | null;
  error: string | null;
  setRunning: (running: boolean) => void;
  setResults: (results: TestResult[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  running: false,
  results: null,
  error: null,
  setRunning: (running) => set({ running }),
  setResults: (results) => set({ results, error: null }),
  setError: (error) => set({ error }),
  reset: () => set({ running: false, results: null, error: null }),
}));
