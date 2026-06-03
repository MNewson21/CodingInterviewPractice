import { create } from 'zustand';
import type { ReviewResponse } from '../types/ai';

interface AiState {
  hints: string[];
  hintLoading: boolean;
  review: ReviewResponse | null;
  reviewLoading: boolean;
  error: string | null;
  addHint: (hint: string) => void;
  setHintLoading: (loading: boolean) => void;
  setReview: (review: ReviewResponse) => void;
  setReviewLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAiStore = create<AiState>((set) => ({
  hints: [],
  hintLoading: false,
  review: null,
  reviewLoading: false,
  error: null,
  addHint: (hint) => set((s) => ({ hints: [...s.hints, hint] })),
  setHintLoading: (hintLoading) => set({ hintLoading }),
  setReview: (review) => set({ review }),
  setReviewLoading: (reviewLoading) => set({ reviewLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ hints: [], hintLoading: false, review: null, reviewLoading: false, error: null }),
}));
