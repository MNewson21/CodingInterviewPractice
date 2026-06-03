import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProblem } from '../features/problems/problems.data';
import { ProblemPanel } from '../features/problems/ProblemPanel';
import { CodeEditor } from '../features/editor/CodeEditor';
import { LanguageSelect } from '../features/editor/LanguageSelect';
import { Timer } from '../features/timer/Timer';
import { RunPanel } from '../features/execution/RunPanel';
import { saveSession } from '../features/sessions/sessions.api';
import { useAuth } from '../lib/auth';
import { useEditorStore } from '../stores/useEditorStore';
import { useTimerStore } from '../stores/useTimerStore';
import { useExecutionStore } from '../stores/useExecutionStore';
import { useSessionStore } from '../stores/useSessionStore';
import { useKeystrokeStore } from '../stores/useKeystrokeStore';

export function SessionPage() {
  const { problemId } = useParams();
  const problem = problemId ? getProblem(problemId) : undefined;

  const { user } = useAuth();
  const language = useEditorStore((s) => s.language);
  const code = useEditorStore((s) => s.code);
  const setCode = useEditorStore((s) => s.setCode);
  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const resetTimer = useTimerStore((s) => s.reset);
  const results = useExecutionStore((s) => s.results);
  const resetExecution = useExecutionStore((s) => s.reset);
  const saving = useSessionStore((s) => s.saving);
  const setSaving = useSessionStore((s) => s.setSaving);
  const setCurrentSessionId = useSessionStore((s) => s.setCurrentSessionId);
  const startRecording = useKeystrokeStore((s) => s.startRecording);

  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Reset editor, timer, results and start a fresh recording when the problem changes.
  useEffect(() => {
    if (problem) {
      setCode(problem.starterCode[language] ?? '');
      resetTimer();
      resetExecution();
      setCurrentSessionId(null);
      setSaveMsg(null);
      startRecording();
    }
    // language switches are handled in LanguageSelect, so only depend on the problem id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id]);

  async function handleSave() {
    if (!problem) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const allPassed =
        !!results && results.length > 0 && results.every((r) => r.verdict === 'pass');
      const saved = await saveSession({
        problemId: problem.id,
        language,
        code,
        status: allPassed ? 'solved' : 'in_progress',
        durationMs: elapsedMs,
        keystrokes: useKeystrokeStore.getState().events,
      });
      setCurrentSessionId(saved.id);
      setSaveMsg('Saved');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-center">
          <p>Problem not found.</p>
          <Link to="/" className="mt-2 inline-block text-sm text-blue-400 hover:underline">
            &larr; Back to problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-2">
        <Link to="/" className="shrink-0 text-sm text-zinc-400 hover:text-zinc-100">
          &larr; Problems
        </Link>
        <h1 className="truncate text-sm font-semibold">{problem.title}</h1>
        <div className="flex shrink-0 items-center gap-4">
          <Timer />
          <LanguageSelect problem={problem} />
          {user ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <Link to="/auth" className="text-xs text-blue-400 hover:underline">
              Sign in to save
            </Link>
          )}
          {saveMsg && <span className="text-xs text-zinc-400">{saveMsg}</span>}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="w-2/5 min-w-[320px] overflow-y-auto border-r border-zinc-800">
          <ProblemPanel problem={problem} />
        </section>
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <CodeEditor />
          </div>
          <div className="h-72 shrink-0">
            <RunPanel problem={problem} />
          </div>
        </section>
      </div>
    </div>
  );
}
