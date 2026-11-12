import problemsJson from '../../data/problems.json';
import type { ProblemMeta, ProblemRuntime } from '../../types/problem';

/**
 * The built-in problem set shipped with the app - metadata only. The run payload
 * (starter code, hidden harness, test cases) is roughly three quarters of the catalog
 * by size and is useless to a visitor browsing the list, so it lives in a separate
 * file that {@link loadProblemRuntime} fetches on demand.
 */
export const problems = problemsJson as ProblemMeta[];

/** Look up a built-in problem's metadata by id. Synchronous - no run payload attached. */
export function getProblemMeta(id: string): ProblemMeta | undefined {
  return problems.find((p) => p.id === id);
}

// Cached as the promise rather than the resolved value, so two components mounting in
// the same tick (the session page's editor and run panel) share one chunk fetch.
let runtimePromise: Promise<Record<string, ProblemRuntime>> | undefined;

/** Fetch (once) the run payloads for the built-in problems, keyed by problem id. */
function loadRuntimeMap(): Promise<Record<string, ProblemRuntime>> {
  runtimePromise ??= import('../../data/problem-runtime.json').then(
    (m) => m.default as Record<string, ProblemRuntime>,
  );
  return runtimePromise;
}

/** Fetch one built-in problem's run payload. Undefined when the id is not built-in. */
export async function loadProblemRuntime(id: string): Promise<ProblemRuntime | undefined> {
  return (await loadRuntimeMap())[id];
}
