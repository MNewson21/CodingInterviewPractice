import problemsJson from '../../data/problems.json';
import type { Problem } from '../../types/problem';
import { useProblemsStore } from '../../stores/useProblemsStore';

/** The built-in problem set shipped with the app. */
export const problems = problemsJson as Problem[];

/** Look up a problem by id across the built-in set and the user's custom set. */
export function getProblem(id: string): Problem | undefined {
  return (
    problems.find((p) => p.id === id) ??
    useProblemsStore.getState().custom.find((p) => p.id === id)
  );
}
