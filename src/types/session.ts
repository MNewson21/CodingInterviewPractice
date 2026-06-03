import type { Language } from './problem';

export interface KeystrokeEvent {
  /** Milliseconds since the session started. */
  t: number;
  range: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
  /** Inserted text. Empty string represents a pure deletion. */
  text: string;
  /** Number of characters removed by this edit. */
  rangeLength: number;
}

export type SessionStatus = 'in_progress' | 'solved' | 'abandoned';

export interface SessionRecord {
  id: string;
  userId: string;
  problemId: string;
  language: Language;
  code: string | null;
  status: SessionStatus;
  durationMs: number | null;
  keystrokes: KeystrokeEvent[];
  aiReview: unknown | null;
  createdAt: string;
}
