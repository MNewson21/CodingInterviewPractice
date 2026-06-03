import type { Language } from '../types/problem';

const ALL: Language[] = ['javascript', 'typescript', 'python', 'java', 'cpp'];

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
