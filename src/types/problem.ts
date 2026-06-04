export type Difficulty = 'easy' | 'medium' | 'hard';

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp';

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
  testCases: TestCase[];
}
