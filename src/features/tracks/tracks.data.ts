import type { Problem } from '../../types/problem';
import { problems } from '../problems/problems.data';

/**
 * A curated study track: a named, ordered playlist of built-in problems (e.g. "Blind 75",
 * "Dynamic Programming"). Tracks are a view over the existing catalog - they add no new
 * problems, they just group the ones already shipped so a learner has a path to follow
 * instead of an undifferentiated list.
 */
export interface Track {
  id: string;
  title: string;
  blurb: string;
  /** Tailwind text-colour class for the card accent, e.g. 'text-emerald-400'. */
  accent: string;
  /** Ordered problem ids; resolved against the built-in catalog at render time. */
  problemIds: string[];
}

export const TRACKS: Track[] = [
  {
    id: 'interviews',
    title: 'Interviews',
    blurb: 'The 15 questions asked most often in real coding interviews - start here.',
    accent: 'text-rose-400',
    problemIds: [
      'two-sum',
      'valid-parentheses',
      'best-time-to-buy-sell-stock',
      'valid-anagram',
      'maximum-subarray',
      'product-except-self',
      'top-k-frequent',
      'longest-substring-no-repeat',
      'container-most-water',
      'coin-change',
      'number-of-islands',
      'merge-intervals',
      'reverse-linked-list',
      'merge-two-sorted-lists',
      'validate-bst',
    ],
  },
  {
    id: 'easy-warmup',
    title: 'Easy Warmup',
    blurb: 'Gentle fundamentals to build momentum before the harder sets.',
    accent: 'text-green-400',
    problemIds: [
      'two-sum',
      'valid-parentheses',
      'reverse-string',
      'contains-duplicate',
      'valid-anagram',
      'best-time-to-buy-sell-stock',
      'valid-palindrome',
      'plus-one',
      'fizzbuzz',
      'climbing-stairs',
    ],
  },
  {
    id: 'blind-75',
    title: 'Blind 75 (in catalog)',
    blurb: 'The classic interview shortlist - every Blind 75 problem this catalog covers.',
    accent: 'text-blue-400',
    problemIds: [
      'two-sum',
      'best-time-to-buy-sell-stock',
      'contains-duplicate',
      'climbing-stairs',
      'reverse-linked-list',
      'merge-two-sorted-lists',
      'invert-binary-tree',
      'max-depth-binary-tree',
      'valid-anagram',
      'valid-parentheses',
      'valid-palindrome',
      'product-except-self',
      'maximum-subarray',
      'search-rotated-array',
      'container-most-water',
      'coin-change',
      'house-robber',
      'unique-paths',
      'jump-game',
      'number-of-islands',
      'longest-substring-no-repeat',
      'top-k-frequent',
      'validate-bst',
    ],
  },
  {
    id: 'dynamic-programming',
    title: 'Dynamic Programming',
    blurb: 'From climbing stairs to edit distance - recognise the patterns DP rewards.',
    accent: 'text-purple-400',
    problemIds: [
      'climbing-stairs',
      'best-time-to-buy-sell-stock',
      'house-robber',
      'maximum-subarray',
      'coin-change',
      'jump-game',
      'unique-paths',
      'edit-distance',
      'trapping-rain-water',
      'regular-expression-matching',
    ],
  },
  {
    id: 'trees-and-lists',
    title: 'Trees & Linked Lists',
    blurb: 'Pointer and recursion drills on the two structures interviews lean on most.',
    accent: 'text-amber-400',
    problemIds: [
      'reverse-linked-list',
      'merge-two-sorted-lists',
      'max-depth-binary-tree',
      'invert-binary-tree',
      'validate-bst',
    ],
  },
  {
    id: 'pointers-and-windows',
    title: 'Two Pointers & Sliding Window',
    blurb: 'Scan arrays and strings in one pass with moving pointers and windows.',
    accent: 'text-cyan-400',
    problemIds: [
      'reverse-string',
      'valid-palindrome',
      'move-zeroes',
      'merge-two-sorted-lists',
      'squares-of-a-sorted-array',
      'container-most-water',
      'longest-substring-no-repeat',
      'subarray-sum-k',
      'sliding-window-maximum',
      'trapping-rain-water',
    ],
  },
  {
    id: 'hard-mode',
    title: 'Hard Mode',
    blurb: 'The toughest problems in the catalog - attempt once the basics feel easy.',
    accent: 'text-red-400',
    problemIds: [
      'trapping-rain-water',
      'edit-distance',
      'largest-rectangle-histogram',
      'first-missing-positive',
      'sliding-window-maximum',
      'n-queens',
      'regular-expression-matching',
    ],
  },
];

/** Look up a single track by its id. */
export function getTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

/**
 * Resolve a track's problem ids to the actual built-in {@link Problem} objects, in track
 * order. Unknown ids are dropped (and reported in dev) so a typo can never crash a page.
 */
export function trackProblems(track: Track): Problem[] {
  const resolved: Problem[] = [];
  for (const id of track.problemIds) {
    const problem = problems.find((p) => p.id === id);
    if (problem) resolved.push(problem);
    else if (import.meta.env.DEV) {
      console.warn(`Track "${track.id}" references unknown problem id "${id}"`);
    }
  }
  return resolved;
}
