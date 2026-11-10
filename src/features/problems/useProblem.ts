import { useEffect, useMemo, useState } from 'react';
import type { Problem, ProblemMeta, ProblemRuntime } from '../../types/problem';
import { useProblemsStore } from '../../stores/useProblemsStore';
import { getProblemMeta, loadProblemRuntime } from './problems.data';

/**
 * Resolve a problem id to a full {@link Problem} for the pages that need to run or
 * replay it, across the built-in set and the user's custom set.
 *
 * Two things are awaited, which is what `resolving` covers: the built-in run payload
 * (a lazily fetched chunk) and the custom-problem store (a network round-trip). Only
 * once both have settled is a missing id really "not found".
 *
 * `meta` is the same problem without its run payload, and for a built-in problem it is
 * there on the first render - so a caller that only needs the title (the replay header)
 * can show it immediately instead of waiting on the fetch.
 */
export function useProblem(problemId: string | undefined): {
  problem: Problem | undefined;
  meta: ProblemMeta | undefined;
  resolving: boolean;
} {
  const custom = useProblemsStore((s) => s.custom);
  const customLoaded = useProblemsStore((s) => s.loaded);
  const loadCustom = useProblemsStore((s) => s.load);
  useEffect(() => {
    loadCustom();
  }, [loadCustom]);

  const meta = problemId ? getProblemMeta(problemId) : undefined;

  // Keyed by id so a stale payload can never be joined onto a different problem's
  // metadata (the id changes before the new fetch resolves when navigating directly
  // from one session to another).
  const [runtime, setRuntime] = useState<{ id: string; data: ProblemRuntime | undefined }>();
  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    void loadProblemRuntime(meta.id).then((data) => {
      if (!cancelled) setRuntime({ id: meta.id, data });
    });
    return () => {
      cancelled = true;
    };
  }, [meta]);

  // Memoised because the join creates a new object: callers put `problem` in effect
  // dependency arrays, and a fresh identity on every render would re-run them all.
  // `meta` is a stable reference out of the catalog array, so this only changes when
  // the problem or its payload really does.
  const builtIn = useMemo(
    () =>
      meta && runtime?.id === meta.id && runtime.data ? { ...meta, ...runtime.data } : undefined,
    [meta, runtime],
  );

  if (meta) return { problem: builtIn, meta, resolving: runtime?.id !== meta.id };

  const customProblem = problemId ? custom.find((p) => p.id === problemId) : undefined;
  return {
    problem: customProblem,
    meta: customProblem,
    resolving: !customProblem && !customLoaded,
  };
}
