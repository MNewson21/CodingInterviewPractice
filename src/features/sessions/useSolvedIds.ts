import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { listSessionSummaries } from './sessions.api';

/**
 * Returns the set of built-in/custom problem ids the signed-in user has solved (a problem
 * is "solved" if any of their sessions for it is marked solved). Guests get an empty set.
 * The single source of solved state for the problem list and the tracks pages. A failed
 * fetch just yields no badges - solved state is a non-critical enhancement.
 *
 * Uses {@link listSessionSummaries} so drawing checkmarks never downloads keystroke logs.
 */
export function useSolvedIds(): Set<string> {
  const { user } = useAuth();
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setSolvedIds(new Set());
      return;
    }
    let cancelled = false;
    listSessionSummaries()
      .then((sessions) => {
        if (cancelled) return;
        setSolvedIds(
          new Set(sessions.filter((s) => s.status === 'solved').map((s) => s.problemId)),
        );
      })
      .catch(() => {
        // Non-critical: leave the set empty so the page renders without solved badges.
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return solvedIds;
}
