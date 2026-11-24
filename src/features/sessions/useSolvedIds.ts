import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { listSessionSummaries } from './sessions.api';

/** Shared empty result, so guests get a stable reference across renders. */
const NO_SOLVED_IDS = new Set<string>();

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
  // Tagged with the user the ids were fetched for. Signing out (or switching accounts)
  // then falls back to the empty set by derivation, rather than by an effect resetting
  // state - which costs an extra render and, on a switch, briefly shows the previous
  // user's badges while the new fetch is in flight.
  const [solved, setSolved] = useState<{ userId: string; ids: Set<string> } | null>(null);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;
    listSessionSummaries()
      .then((sessions) => {
        if (cancelled) return;
        setSolved({
          userId,
          ids: new Set(sessions.filter((s) => s.status === 'solved').map((s) => s.problemId)),
        });
      })
      .catch(() => {
        // Non-critical: leave the set empty so the page renders without solved badges.
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return user && solved?.userId === user.id ? solved.ids : NO_SOLVED_IDS;
}
