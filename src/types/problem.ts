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
  testCases: TestCase[];
}
