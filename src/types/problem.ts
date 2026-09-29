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

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  /** Markdown-ish plain text for v1; upgrade to react-markdown later. */
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  starterCode: Partial<Record<Language, string>>;
  /**
   * Hidden per-language I/O glue, appended to the user's code at run time so the
   * editor only shows the function (LeetCode-style). The harness reads stdin,
   * calls the user's function, and prints the result. Optional: when absent, the
   * user's code is run as-is and must print its own output.
   */
  harness?: Partial<Record<Language, string>>;
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
  testCases: TestCase[];
}
