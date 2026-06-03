import type { KeystrokeEvent } from '../../types/session';

// Subset of Monaco's IModelContentChange that we record.
export interface MonacoChange {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  rangeLength: number;
  text: string;
}

/** Map a batch of Monaco content changes to relative-timestamped events. */
export function changesToEvents(changes: readonly MonacoChange[], startTime: number): KeystrokeEvent[] {
  const t = Date.now() - startTime;
  return changes.map((c) => ({
    t,
    range: {
      startLine: c.range.startLineNumber,
      startCol: c.range.startColumn,
      endLine: c.range.endLineNumber,
      endCol: c.range.endColumn,
    },
    text: c.text,
    rangeLength: c.rangeLength,
  }));
}
