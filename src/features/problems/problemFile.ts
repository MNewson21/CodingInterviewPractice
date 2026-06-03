import type {
  Difficulty,
  Language,
  Problem,
  ProblemExample,
  TestCase,
} from '../../types/problem';

/** A Problem without its id — what we store in the DB and ship in shared files. */
export type ProblemData = Omit<Problem, 'id'>;

export const PROBLEM_SCHEMA_VERSION = 1;

const MAX_TEST_CASES = 50;
const MAX_LEN = 20_000;
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const LANGUAGES: Language[] = ['javascript', 'typescript', 'python', 'java', 'cpp'];

function str(
  v: unknown,
  field: string,
  opts: { required?: boolean; max?: number } = {},
): string {
  const { required = false, max = MAX_LEN } = opts;
  if (v == null) {
    if (required) throw new Error(`Missing "${field}"`);
    return '';
  }
  if (typeof v !== 'string') throw new Error(`"${field}" must be a string`);
  if (v.length > max) throw new Error(`"${field}" is too long (max ${max} chars)`);
  return v;
}

/** Validate + normalize an uploaded/pasted problem file into ProblemData. Throws on invalid input. */
export function parseProblemData(text: string): ProblemData {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Not valid JSON');
  }
  if (typeof raw !== 'object' || raw == null) throw new Error('File must be a JSON object');

  const title = str(raw.title, 'title', { required: true, max: 200 }).trim();
  if (!title) throw new Error('"title" is required');

  const difficulty: Difficulty = DIFFICULTIES.includes(raw.difficulty as Difficulty)
    ? (raw.difficulty as Difficulty)
    : 'medium';

  const tags: string[] = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === 'string').slice(0, 20)
    : [];

  const description = str(raw.description, 'description', { max: MAX_LEN });

  const examples: ProblemExample[] = Array.isArray(raw.examples)
    ? raw.examples.slice(0, 20).map((e: Record<string, unknown>) => ({
        input: str(e?.input, 'example.input', { max: 2000 }),
        output: str(e?.output, 'example.output', { max: 2000 }),
        ...(e?.explanation
          ? { explanation: str(e.explanation, 'example.explanation', { max: 2000 }) }
          : {}),
      }))
    : [];

  const constraints: string[] = Array.isArray(raw.constraints)
    ? raw.constraints.filter((c): c is string => typeof c === 'string').slice(0, 30)
    : [];

  const starterCode: Partial<Record<Language, string>> = {};
  if (raw.starterCode && typeof raw.starterCode === 'object') {
    const sc = raw.starterCode as Record<string, unknown>;
    for (const l of LANGUAGES) {
      if (typeof sc[l] === 'string') {
        starterCode[l] = str(sc[l], `starterCode.${l}`, { max: MAX_LEN });
      }
    }
  }

  if (!Array.isArray(raw.testCases) || raw.testCases.length === 0) {
    throw new Error('"testCases" must be a non-empty array');
  }
  if (raw.testCases.length > MAX_TEST_CASES) {
    throw new Error(`Too many test cases (max ${MAX_TEST_CASES})`);
  }
  const testCases: TestCase[] = raw.testCases.map((t: Record<string, unknown>, i: number) => {
    if (typeof t !== 'object' || t == null) throw new Error(`testCase ${i + 1} must be an object`);
    return {
      ...(t.name ? { name: str(t.name, `testCase ${i + 1} name`, { max: 200 }) } : {}),
      stdin: str(t.stdin, `testCase ${i + 1} stdin`),
      expectedStdout: str(t.expectedStdout, `testCase ${i + 1} expectedStdout`, { required: true }),
    };
  });

  return { title, difficulty, tags, description, examples, constraints, starterCode, testCases };
}

/** Serialize a problem to the shareable file format (with a schema-version marker). */
export function buildProblemFile(problem: Problem): string {
  const { id: _id, ...data } = problem;
  return JSON.stringify({ schemaVersion: PROBLEM_SCHEMA_VERSION, ...data }, null, 2);
}

/** Trigger a download of the problem as a .json file. */
export function downloadProblem(problem: Problem): void {
  const slug = problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'problem';
  const blob = new Blob([buildProblemFile(problem)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
