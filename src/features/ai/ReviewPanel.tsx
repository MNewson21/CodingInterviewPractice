import { useEditorStore } from '../../stores/useEditorStore';
import { useExecutionStore } from '../../stores/useExecutionStore';
import { useAiStore } from '../../stores/useAiStore';
import { fetchReview } from './aiClient';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import type { Problem } from '../../types/problem';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-zinc-500">{label}: </span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}

export function ReviewPanel({ problem }: { problem: Problem }) {
  const code = useEditorStore((s) => s.code);
  const language = useEditorStore((s) => s.language);
  const results = useExecutionStore((s) => s.results);
  const review = useAiStore((s) => s.review);
  const loading = useAiStore((s) => s.reviewLoading);
  const error = useAiStore((s) => s.error);
  const setReview = useAiStore((s) => s.setReview);
  const setReviewLoading = useAiStore((s) => s.setReviewLoading);
  const setError = useAiStore((s) => s.setError);

  const summary = results
    ? `${results.filter((r) => r.verdict === 'pass').length}/${results.length} passed`
    : 'not run';

  async function handleReview() {
    setReviewLoading(true);
    setError(null);
    try {
      const res = await fetchReview({
        title: problem.title,
        description: problem.description,
        language,
        code,
        testSummary: summary,
      });
      setReview(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">AI review</h3>
        <button
          type="button"
          onClick={handleReview}
          disabled={!isSupabaseConfigured || loading}
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? 'Reviewing…' : 'Get review'}
        </button>
      </div>

      {review && (
        <div className="space-y-2 rounded border border-zinc-800 bg-zinc-900 p-3 text-xs">
          <Row label="Correctness" value={review.correctness} />
          <Row label="Time" value={review.timeComplexity} />
          <Row label="Space" value={review.spaceComplexity} />
          <div>
            <span className="text-zinc-500">Improvements:</span>
            <ul className="mt-1 list-inside list-disc text-zinc-200">
              {review.improvements.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
          <p className="text-zinc-300">{review.summary}</p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
