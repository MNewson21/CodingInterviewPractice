import type { Language, Problem } from '../types/problem';

const ALL: Language[] = ['javascript', 'typescript', 'python', 'java', 'cpp'];

const COMMENT_PREFIX: Record<Language, string> = {
  javascript: '//',
  typescript: '//',
  python: '#',
  java: '//',
  cpp: '//',
};

/**
 * Starter code for a problem in a given language, with a graceful fallback: when the
 * problem provides none for that language, return a guiding comment instead of an
 * empty editor (custom problems often only define starter for some languages).
 */
export function starterFor(problem: Problem, language: Language): string {
  const existing = problem.starterCode[language];
  if (existing != null) return existing;
  return `${COMMENT_PREFIX[language]} No starter code for ${LANGUAGE_LABELS[language]} here - write your solution below.\n`;
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};

// Restrict the language dropdown to what the Piston instance actually has.
// Set VITE_ENABLED_LANGUAGES="python,javascript,typescript" to match installed
// runtimes. Unset => all languages (local dev with a full Piston).
function parseEnabled(): Language[] {
  const raw = import.meta.env.VITE_ENABLED_LANGUAGES;
  if (!raw) return ALL;
  const wanted = raw.split(',').map((s) => s.trim().toLowerCase());
  const filtered = ALL.filter((l) => wanted.includes(l));
  return filtered.length ? filtered : ALL;
}

export const ENABLED_LANGUAGES: Language[] = parseEnabled();
