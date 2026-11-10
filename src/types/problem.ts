export type Difficulty = 'easy' | 'medium' | 'hard';

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp';

/**
 * How a test case's output is compared with `expectedStdout`.
 * - `exact` (default) - must match after whitespace normalisation.
 * - `unordered` - the output is a JSON array whose TOP-LEVEL elements may come
 *   back in any order, for problems like Subsets or Permutations where every
 *   ordering is a correct answer. Order INSIDE each element is still
 *   significant (so `[1,2]` never matches `[2,1]`), which is what keeps
 *   Permutations judgeable; a problem using this must therefore state a
 *   canonical order for the contents of each element.
 */
export type JudgeMode = 'exact' | 'unordered';

export interface TestCase {
  name?: string;
  stdin: string;
  expectedStdout: string;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

/**
 * Everything needed to LIST and READ a problem: what the catalog, the problem list and
 * the problem panel render. This is the half that ships in `src/data/problems.json` and
 * is downloaded by every visitor, so nothing session-only belongs here.
 */
export interface ProblemMeta {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  /** Markdown-ish plain text for v1; upgrade to react-markdown later. */
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  /**
   * Optional display metadata: names the stdin lines as function arguments so the
   * Run panel can show `word1="sunday", word2="saturday"` instead of raw stdin.
   * One entry per stdin line, in order. `quote` wraps the value in quotes (for
   * string arguments).
   */
  params?: { name: string; quote?: boolean }[];
  /**
   * How every test case of this problem is judged. Omitted means `exact`, so
   * existing problems keep byte-comparison semantics.
   */
  judge?: JudgeMode;
}

/**
 * Everything needed to SOLVE a problem, and nothing needed to list one. For built-in
 * problems this lives in `src/data/problem-runtime.json`, keyed by problem id, and is
 * fetched on demand by the session and replay pages - it is roughly three quarters of
 * the catalog by size, so keeping it off the landing page is the point of the split.
 */
export interface ProblemRuntime {
  starterCode: Partial<Record<Language, string>>;
  /**
   * Hidden per-language I/O glue, appended to the user's code at run time so the
   * editor only shows the function (LeetCode-style). The harness reads stdin,
   * calls the user's function, and prints the result. Optional: when absent, the
   * user's code is run as-is and must print its own output.
   */
  harness?: Partial<Record<Language, string>>;
  testCases: TestCase[];
}

/**
 * A problem with its run payload attached - what a session works with, what an
 * exported/imported problem file contains, and how the user's custom problems are
 * stored. Built-in problems only reach this shape once the runtime half is loaded
 * (see the `useProblem` hook).
 */
export type Problem = ProblemMeta & ProblemRuntime;
