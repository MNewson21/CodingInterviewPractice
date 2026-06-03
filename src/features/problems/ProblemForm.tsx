import { useState } from 'react';
import type { Difficulty } from '../../types/problem';
import { ENABLED_LANGUAGES, LANGUAGE_LABELS } from '../../lib/languages';
import { parseProblemData } from './problemFile';
import { saveUserProblem } from './userProblems.api';
import { useProblemsStore } from '../../stores/useProblemsStore';

const inputClass =
  'w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none';
const codeClass = `${inputClass} font-mono`;
const labelClass = 'mb-1 block text-xs font-medium text-zinc-400';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

interface ExampleField {
  input: string;
  output: string;
  explanation: string;
}
interface TestCaseField {
  name: string;
  stdin: string;
  expectedStdout: string;
}

const emptyExample = (): ExampleField => ({ input: '', output: '', explanation: '' });
const emptyTestCase = (): TestCaseField => ({ name: '', stdin: '', expectedStdout: '' });

/**
 * Form to author a custom problem without hand-writing JSON. It assembles a draft
 * object and runs it through `parseProblemData` (the same validator used for file
 * imports) so there is one source of truth for what a valid problem looks like.
 */
export function ProblemForm({ onCreated }: { onCreated?: () => void }) {
  const addCustom = useProblemsStore((s) => s.addCustom);

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [tagsText, setTagsText] = useState('');
  const [description, setDescription] = useState('');
  const [examples, setExamples] = useState<ExampleField[]>([emptyExample()]);
  const [constraintsText, setConstraintsText] = useState('');
  const [starter, setStarter] = useState<Record<string, string>>({});
  const [testCases, setTestCases] = useState<TestCaseField[]>([emptyTestCase()]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle('');
    setDifficulty('easy');
    setTagsText('');
    setDescription('');
    setExamples([emptyExample()]);
    setConstraintsText('');
    setStarter({});
    setTestCases([emptyTestCase()]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Build a draft in the shared file shape, then validate/normalize it with the
      // exact same parser the .json import uses (keeps one validation source of truth).
      const draft = {
        title,
        difficulty,
        tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
        description,
        examples: examples
          .filter((ex) => ex.input.trim() || ex.output.trim())
          .map((ex) => ({
            input: ex.input,
            output: ex.output,
            ...(ex.explanation.trim() ? { explanation: ex.explanation } : {}),
          })),
        constraints: constraintsText.split('\n').map((c) => c.trim()).filter(Boolean),
        starterCode: Object.fromEntries(
          Object.entries(starter).filter(([, code]) => code.trim()),
        ),
        testCases: testCases
          .filter((tc) => tc.stdin.trim() || tc.expectedStdout.trim())
          .map((tc) => ({
            ...(tc.name.trim() ? { name: tc.name } : {}),
            stdin: tc.stdin,
            expectedStdout: tc.expectedStdout,
          })),
      };

      const data = parseProblemData(JSON.stringify(draft)); // throws on invalid input
      const saved = await saveUserProblem(data);
      addCustom(saved);
      reset();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      {/* Title + difficulty */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label className={labelClass} htmlFor="pf-title">Title</label>
          <input
            id="pf-title"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Two Sum"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-difficulty">Difficulty</label>
          <select
            id="pf-difficulty"
            className={inputClass}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass} htmlFor="pf-tags">Tags (comma-separated)</label>
        <input
          id="pf-tags"
          className={inputClass}
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="array, hash-map"
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelClass} htmlFor="pf-description">Description</label>
        <textarea
          id="pf-description"
          className={inputClass}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={'What the function should do.\n\nExplain the stdin/stdout format your test cases expect.'}
        />
      </div>

      {/* Examples */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-zinc-300">Examples</legend>
        {examples.map((ex, i) => (
          <div key={i} className="space-y-2 rounded border border-zinc-800 p-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputClass}
                value={ex.input}
                onChange={(e) => setExamples((xs) => xs.map((x, j) => (j === i ? { ...x, input: e.target.value } : x)))}
                placeholder="Input — e.g. nums = [2,7], target = 9"
              />
              <input
                className={inputClass}
                value={ex.output}
                onChange={(e) => setExamples((xs) => xs.map((x, j) => (j === i ? { ...x, output: e.target.value } : x)))}
                placeholder="Output — e.g. [0,1]"
              />
            </div>
            <input
              className={inputClass}
              value={ex.explanation}
              onChange={(e) => setExamples((xs) => xs.map((x, j) => (j === i ? { ...x, explanation: e.target.value } : x)))}
              placeholder="Explanation (optional)"
            />
            {examples.length > 1 && (
              <button
                type="button"
                onClick={() => setExamples((xs) => xs.filter((_, j) => j !== i))}
                className="text-xs text-zinc-500 hover:text-red-400"
              >
                Remove example
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setExamples((xs) => [...xs, emptyExample()])}
          className="text-xs text-emerald-400 hover:underline"
        >
          + Add example
        </button>
      </fieldset>

      {/* Constraints */}
      <div>
        <label className={labelClass} htmlFor="pf-constraints">Constraints (one per line)</label>
        <textarea
          id="pf-constraints"
          className={inputClass}
          rows={3}
          value={constraintsText}
          onChange={(e) => setConstraintsText(e.target.value)}
          placeholder={'2 <= nums.length <= 10^4\nOnly one valid answer exists.'}
        />
      </div>

      {/* Starter code per enabled language */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-zinc-300">Starter code (optional)</legend>
        {ENABLED_LANGUAGES.map((lang) => (
          <div key={lang}>
            <label className={labelClass} htmlFor={`pf-starter-${lang}`}>{LANGUAGE_LABELS[lang]}</label>
            <textarea
              id={`pf-starter-${lang}`}
              className={codeClass}
              rows={4}
              value={starter[lang] ?? ''}
              onChange={(e) => setStarter((s) => ({ ...s, [lang]: e.target.value }))}
              placeholder={'function solve(...) {\n  // your code here\n}'}
              spellCheck={false}
            />
          </div>
        ))}
      </fieldset>

      {/* Test cases */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-zinc-300">Test cases</legend>
        <p className="text-xs text-zinc-500">
          Each case feeds <code className="text-zinc-400">stdin</code> to the program and compares its
          output against <code className="text-zinc-400">expected output</code> (whitespace-trimmed).
        </p>
        {testCases.map((tc, i) => (
          <div key={i} className="space-y-2 rounded border border-zinc-800 p-3">
            <input
              className={inputClass}
              value={tc.name}
              onChange={(e) => setTestCases((ts) => ts.map((t, j) => (j === i ? { ...t, name: e.target.value } : t)))}
              placeholder={`Name (optional) — e.g. example ${i + 1}`}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>stdin</label>
                <textarea
                  className={codeClass}
                  rows={3}
                  value={tc.stdin}
                  onChange={(e) => setTestCases((ts) => ts.map((t, j) => (j === i ? { ...t, stdin: e.target.value } : t)))}
                  placeholder={'[2,7,11,15]\n9'}
                  spellCheck={false}
                />
              </div>
              <div>
                <label className={labelClass}>expected output</label>
                <textarea
                  className={codeClass}
                  rows={3}
                  value={tc.expectedStdout}
                  onChange={(e) => setTestCases((ts) => ts.map((t, j) => (j === i ? { ...t, expectedStdout: e.target.value } : t)))}
                  placeholder="[0,1]"
                  spellCheck={false}
                />
              </div>
            </div>
            {testCases.length > 1 && (
              <button
                type="button"
                onClick={() => setTestCases((ts) => ts.filter((_, j) => j !== i))}
                className="text-xs text-zinc-500 hover:text-red-400"
              >
                Remove test case
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTestCases((ts) => [...ts, emptyTestCase()])}
          className="text-xs text-emerald-400 hover:underline"
        >
          + Add test case
        </button>
      </fieldset>

      {error && <p className="text-xs text-red-400">Could not create: {error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create problem'}
        </button>
        <button type="button" onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-300">
          Clear form
        </button>
      </div>
    </form>
  );
}
