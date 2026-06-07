import { useEditorStore } from '../../stores/useEditorStore';
import { useAiStore } from '../../stores/useAiStore';
import { useStuckDetector } from './useStuckDetector';
import { fetchHint } from './aiClient';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import type { Problem } from '../../types/problem';

export function HintPanel({ problem }: { problem: Problem }) {
  const code = useEditorStore((s) => s.code);
  const language = useEditorStore((s) => s.language);
  const hints = useAiStore((s) => s.hints);
  const loading = useAiStore((s) => s.hintLoading);
  const error = useAiStore((s) => s.error);
  const addHint = useAiStore((s) => s.addHint);
  const setHintLoading = useAiStore((s) => s.setHintLoading);
  const setError = useAiStore((s) => s.setError);
  const { stuck } = useStuckDetector();

  const level = hints.length + 1;
  const maxed = hints.length >= 3;
  const unlocked = stuck || hints.length > 0;
  const canRequest = isSupabaseConfigured && !loading && !maxed && unlocked;

  async function handleHint() {
    setHintLoading(true);
    setError(null);
    try {
      const res = await fetchHint({
        title: problem.title,
        description: problem.description,
        language,
        code,
        level,
        priorHints: hints,
      });
      addHint(res.hint);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setHintLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">AI hints</h3>
        <button
          type="button"
          onClick={handleHint}
          disabled={!canRequest}
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? 'Thinking…' : maxed ? 'No more hints' : `Get hint ${level}`}
        </button>
      </div>

      {!isSupabaseConfigured && (
        <p className="text-xs text-zinc-600">
          AI features need the Supabase Edge Functions deployed.
        </p>
      )}
      {isSupabaseConfigured && !unlocked && hints.length === 0 && (
        <p className="text-xs text-zinc-600">
          Keep trying — a hint unlocks after you’ve been stuck a little while.
        </p>
      )}

      <ol className="mt-2 space-y-2">
        {hints.map((h, i) => (
          <li key={i} className="rounded border border-zinc-800 bg-zinc-900 p-2 text-xs">
            <span className="text-zinc-500">Hint {i + 1}: </span>
            <span className="text-zinc-200">{h}</span>
          </li>
        ))}
      </ol>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
