import { useEditorStore } from '../../stores/useEditorStore';
import type { Language, Problem } from '../../types/problem';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

export function LanguageSelect({ problem }: { problem: Problem }) {
  const language = useEditorStore((s) => s.language);
  const setLanguage = useEditorStore((s) => s.setLanguage);
  const setCode = useEditorStore((s) => s.setCode);

  function handleChange(next: Language) {
    setLanguage(next);
    setCode(problem.starterCode[next] ?? '');
  }

  return (
    <select
      value={language}
      onChange={(e) => handleChange(e.target.value as Language)}
      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100"
    >
      {LANGUAGES.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
