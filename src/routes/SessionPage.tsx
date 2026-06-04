import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { problems } from '../features/problems/problems.data';
import { downloadProblem } from '../features/problems/problemFile';
import { ProblemPanel } from '../features/problems/ProblemPanel';
import { CodeEditor } from '../features/editor/CodeEditor';
import { LanguageSelect } from '../features/editor/LanguageSelect';
import { Timer } from '../features/timer/Timer';
import { RunPanel } from '../features/execution/RunPanel';
import { ComplexityBadge } from '../features/analysis/ComplexityBadge';
import { AiPanel } from '../features/ai/AiPanel';
import { AuthRequiredError, getSession, saveSession, updateSession } from '../features/sessions/sessions.api';
import { useAuth } from '../lib/auth';
import { useEditorStore } from '../stores/useEditorStore';
import { useTimerStore } from '../stores/useTimerStore';
import { useExecutionStore } from '../stores/useExecutionStore';
import { useSessionStore } from '../stores/useSessionStore';
import { useKeystrokeStore } from '../stores/useKeystrokeStore';
import { useAiStore } from '../stores/useAiStore';
import { useProblemsStore } from '../stores/useProblemsStore';

export function SessionPage() {
  const { problemId } = useParams();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('session');

  const custom = useProblemsStore((s) => s.custom);
  const customLoaded = useProblemsStore((s) => s.loaded);
  const loadCustom = useProblemsStore((s) => s.load);
  useEffect(() => {
    loadCustom();
  }, [loadCustom]);

  const problem = useMemo(
    () =>
      problemId
        ? problems.find((p) => p.id === problemId) ?? custom.find((p) => p.id === problemId)
        : undefined,
    [problemId, custom],
  );
  const resolving = !problem && !customLoaded;

  const { user } = useAuth();
  const language = useEditorStore((s) => s.language);
  const code = useEditorStore((s) => s.code);
  const setCode = useEditorStore((s) => s.setCode);
  const setLanguage = useEditorStore((s) => s.setLanguage);
  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const resetTimer = useTimerStore((s) => s.reset);
  const setElapsedMs = useTimerStore((s) => s.setElapsedMs);
  const results = useExecutionStore((s) => s.results);
  const resetExecution = useExecutionStore((s) => s.reset);
  const saving = useSessionStore((s) => s.saving);
  const setSaving = useSessionStore((s) => s.setSaving);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const setCurrentSessionId = useSessionStore((s) => s.setCurrentSessionId);
  const startRecording = useKeystrokeStore((s) => s.startRecording);
  const resumeRecording = useKeystrokeStore((s) => s.resumeRecording);
  const resetAi = useAiStore((s) => s.reset);

  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Initialise the workspace whenever the resolved problem (or resume target) changes.
  // With ?session=<id> we reload that saved attempt to keep editing it; otherwise we
  // start a fresh recording from the starter code.
  useEffect(() => {
    if (!problem) return;

    if (resumeId) {
      let cancelled = false;
      getSession(resumeId)
        .then((s) => {
          if (cancelled) return;
          if (!s) {
            setSaveMsg('Could not load that session.');
            return;
          }
          // Seed editor + timer from the saved attempt, then resume recording on top
          // of its keystrokes so the replay reconstructs old + new edits in order.
          setLanguage(s.language);
          setCode(s.code ?? '');
          setElapsedMs(s.durationMs ?? 0);
          resetExecution();
          resetAi();
          setCurrentSessionId(s.id);
          setSaveMsg('Resumed — edit and Save to update.');
          resumeRecording(s.keystrokes);
        })
        .catch((err) => {
          if (!cancelled) setSaveMsg(err instanceof Error ? err.message : String(err));
        });
      return () => {
        cancelled = true;
      };
    }

    setCode(problem.starterCode[language] ?? '');
    resetTimer();
    resetExecution();
    resetAi();
    setCurrentSessionId(null);
    setSaveMsg(null);
    startRecording();
    // language switches are handled in LanguageSelect, so only depend on the problem id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id, resumeId]);

  async function handleSave() {
    if (!problem) return;
    if (!user) {
      setSaveMsg('Sign in to save your progress — your code stays in the editor.');
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const allPassed =
        !!results && results.length > 0 && results.every((r) => r.verdict === 'pass');
      const input = {
        problemId: problem.id,
        language,
        code,
        status: (allPassed ? 'solved' : 'in_progress') as 'solved' | 'in_progress',
        durationMs: elapsedMs,
        keystrokes: useKeystrokeStore.getState().events,
      };
      // Update the existing row when we're editing a saved attempt; insert otherwise.
      const saved = currentSessionId
        ? await updateSession(currentSessionId, input)
        : await saveSession(input);
      setCurrentSessionId(saved.id);
      setSaveMsg(currentSessionId ? 'Updated' : 'Saved');
    } catch (err) {
      // Token expired mid-session: useAuth flips `user` to null (swapping the button to
      // "Sign in to save"); show a clear message and keep the buffer so no work is lost.
      if (err instanceof AuthRequiredError) {
        setSaveMsg('Your sign-in expired — sign in again to save. Your code is kept.');
      } else {
        setSaveMsg(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setSaving(false);
    }
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-100">
        {resolving ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="text-center">
            <p>Problem not found.</p>
            <Link to="/" className="mt-2 inline-block text-sm text-blue-400 hover:underline">
              &larr; Back to problems
            </Link>
          </div>
        )}
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
          <button
            type="button"
            onClick={() => downloadProblem(problem)}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs hover:bg-zinc-700"
            title="Download this problem as a shareable .json"
          >
            Export
          </button>
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
          <AiPanel problem={problem} />
        </section>
        <section className="flex min-w-0 flex-1 flex-col">
          <ComplexityBadge />
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
