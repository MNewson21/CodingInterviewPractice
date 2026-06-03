import problemsJson from '../../data/problems.json';
import type { Problem } from '../../types/problem';

export const problems = problemsJson as Problem[];

export function getProblem(id: string): Problem | undefined {
  return problems.find((p) => p.id === id);
}
