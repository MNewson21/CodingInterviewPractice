import { useEditorStore } from '../../stores/useEditorStore';
import { useExecutionStore } from '../../stores/useExecutionStore';
import { runTests, type Verdict } from './testRunner';
import type { Problem } from '../../types/problem';

const verdictStyle: Record<Verdict, string> = {
  pass: 'text-green-400',
  fail: 'text-red-400',
  error: 'text-yellow-400',
};

export function RunPanel({ problem }: { problem: Problem }) {
  const code = useEditorStore((s) => s.code);
  const language = useEditorStore((s) => s.language);
  const running = useExecutionStore((s) => s.running);
  const results = useExecutionStore((s) => s.results);
  const error = useExecutionStore((s) => s.error);
  const setRunning = useExecutionStore((s) => s.setRunning);
  const setResults = useExecutionStore((s) => s.setResults);
  const setError = useExecutionStore((s) => s.setError);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const res = await runTests({ language, code, testCases: problem.testCases });
      setResults(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  const passed = results?.filter((r) => r.verdict === 'pass').length ?? 0;
  const total = results?.length ?? 0;

  return (
    <div className="flex h-full flex-col border-t border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? 'Running…' : 'Run tests'}
          </button>
          {results && (
            <span className="text-sm text-zinc-400">
              {passed}/{total} passed
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-600">via Piston</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {error && (
          <p className="rounded border border-red-900 bg-red-950/40 p-2 text-xs text-red-300">
            {error}
          </p>
        )}
        {!error && !results && (
          <p className="text-xs text-zinc-600">Run the tests to see results.</p>
        )}
        {results && (
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={i} className="rounded border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className={`text-xs font-semibold uppercase ${verdictStyle[r.verdict]}`}>
                    {r.verdict}
                  </span>
                </div>
                {r.verdict !== 'pass' && (
                  <div className="mt-2 space-y-1 font-mono text-xs">
                    <div>
                      <span className="text-zinc-500">expected: </span>
                      <span className="whitespace-pre-wrap text-zinc-300">{r.expected}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">actual: </span>
                      <span className="whitespace-pre-wrap text-zinc-300">{r.actual || '(empty)'}</span>
                    </div>
                    {r.stderr && (
                      <div>
                        <span className="text-zinc-500">stderr: </span>
                        <span className="whitespace-pre-wrap text-red-300">{r.stderr}</span>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
