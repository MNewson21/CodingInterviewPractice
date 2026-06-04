import { useEditorStore } from '../../stores/useEditorStore';
import { ENABLED_LANGUAGES, LANGUAGE_LABELS, starterFor } from '../../lib/languages';
import type { Language, Problem } from '../../types/problem';

export function LanguageSelect({ problem }: { problem: Problem }) {
  const language = useEditorStore((s) => s.language);
  const setLanguage = useEditorStore((s) => s.setLanguage);
  const setCode = useEditorStore((s) => s.setCode);

  function handleChange(next: Language) {
    setLanguage(next);
    setCode(starterFor(problem, next));
  }

  return (
    <select
      value={language}
      onChange={(e) => handleChange(e.target.value as Language)}
      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100"
      aria-label="Language"
    >
      {ENABLED_LANGUAGES.map((l) => (
        <option key={l} value={l}>
          {LANGUAGE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
