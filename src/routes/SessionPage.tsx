import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { problems } from '../features/problems/problems.data';
import { downloadProblem } from '../features/problems/problemFile';
import { ProblemPanel } from '../features/problems/ProblemPanel';
import { CodeEditor } from '../features/editor/CodeEditor';
import { LanguageSelect } from '../features/editor/LanguageSelect';
import { ThemeSwitcher } from '../features/editor/ThemeSwitcher';
import { Timer } from '../features/timer/Timer';
import { RunPanel } from '../features/execution/RunPanel';
import { ComplexityBadge } from '../features/analysis/ComplexityBadge';
import { AiPanel } from '../features/ai/AiPanel';
import {
  AuthRequiredError,
  getSession,
  keystrokesByteSize,
  MAX_KEYSTROKES_BYTES,
  saveSession,
  updateSession,
} from '../features/sessions/sessions.api';
import type { KeystrokeEvent } from '../types/session';
import { useAuth } from '../lib/auth';
import { starterFor } from '../lib/languages';
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

  // Resizable split layout. Active on desktop only; mobile keeps the stacked layout.
  const splitRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(40); // problem panel width, % of the split
  const [runHeight, setRunHeight] = useState(288); // test-cases panel height, px
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Drag the vertical divider to resize the problem panel vs. the editor.
  const startDragX = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = splitRef.current;
    if (!container) return;
    const onMove = (ev: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(70, Math.max(20, pct)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Drag the horizontal divider to resize the editor vs. the test-cases panel.
  const startDragY = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pane = rightPaneRef.current;
    if (!pane) return;
    const onMove = (ev: PointerEvent) => {
      const rect = pane.getBoundingClientRect();
      const h = rect.bottom - ev.clientY;
      setRunHeight(Math.min(rect.height - 160, Math.max(120, h)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

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
          setSaveMsg('Resumed - edit and Save to update.');
          resumeRecording(s.keystrokes);
        })
        .catch((err) => {
          if (!cancelled) setSaveMsg(err instanceof Error ? err.message : String(err));
        });
      return () => {
        cancelled = true;
      };
    }

    setCode(starterFor(problem, language));
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
      setSaveMsg('Sign in to save your progress - your code stays in the editor.');
      return;
    }
    setSaving(true);
    setSaveMsg(null);

    const allPassed =
      !!results && results.length > 0 && results.every((r) => r.verdict === 'pass');
    const base = {
      problemId: problem.id,
      language,
      code,
      status: (allPassed ? 'solved' : 'in_progress') as 'solved' | 'in_progress',
      durationMs: elapsedMs,
    };
    const events = useKeystrokeStore.getState().events;
    // Size guard: a very long session can produce a multi-MB keystroke log. Rather than
    // risk a slow or rejected save, drop the replay log when it's oversized so the row
    // (code + progress) still persists - replay is the expendable part.
    const oversized = keystrokesByteSize(events) > MAX_KEYSTROKES_BYTES;

    // Update the existing row when editing a saved attempt; insert otherwise.
    const persist = (keystrokes: KeystrokeEvent[]) => {
      const input = { ...base, keystrokes };
      return currentSessionId ? updateSession(currentSessionId, input) : saveSession(input);
    };

    try {
      const saved = await persist(oversized ? [] : events);
      setCurrentSessionId(saved.id);
      setSaveMsg(
        oversized
          ? 'Saved - this session is too long to store keystroke replay, so replay is unavailable for it. Your code is saved.'
          : currentSessionId
            ? 'Updated'
            : 'Saved',
      );
    } catch (err) {
      // Token expired mid-session: useAuth flips `user` to null (swapping the button to
      // "Sign in to save"); show a clear message and keep the buffer so no work is lost.
      if (err instanceof AuthRequiredError) {
        setSaveMsg('Your sign-in expired - sign in again to save. Your code is kept.');
      } else if (!oversized && events.length > 0) {
        // Save-failure recovery: the keystroke payload may have been rejected (size/network).
        // Retry once without it so the user's code is never lost to a replay-log problem.
        try {
          const saved = await persist([]);
          setCurrentSessionId(saved.id);
          setSaveMsg('Saved your code, but keystroke replay could not be saved this time.');
        } catch (err2) {
          setSaveMsg(err2 instanceof Error ? err2.message : String(err2));
        }
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
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-zinc-800 px-4 py-2">
        <Link to="/" className="shrink-0 text-sm text-zinc-400 hover:text-zinc-100">
          &larr; Problems
        </Link>
        <h1 className="truncate text-sm font-semibold">{problem.title}</h1>
        <div className="flex shrink-0 items-center gap-4">
          <ThemeSwitcher />
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

      {!user && (
        <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-400">
          Guest mode - solve and run freely.{' '}
          <Link to="/auth" className="text-blue-400 hover:underline">
            Sign in
          </Link>{' '}
          to save your history.
        </div>
      )}

      {/* Mobile: stack the panels and let the whole area scroll (the editor gets a
          fixed height so Monaco can render). md+: the classic side-by-side split with
          each pane managing its own scroll inside the viewport. */}
      <div ref={splitRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <section
          style={isDesktop ? { width: `${leftWidth}%` } : undefined}
          className="border-b border-zinc-800 md:min-w-[200px] md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r"
        >
          <ProblemPanel problem={problem} />
          <AiPanel problem={problem} />
        </section>

        {/* Drag to resize the problem panel vs. the editor (desktop only). */}
        <div
          onPointerDown={startDragX}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize problem panel"
          className="hidden w-1.5 shrink-0 cursor-col-resize bg-zinc-800 transition-colors hover:bg-blue-500/60 md:block"
        />

        <section ref={rightPaneRef} className="flex min-w-0 flex-col md:flex-1">
          <ComplexityBadge />
          <div className="h-[60vh] md:h-auto md:min-h-0 md:flex-1">
            <CodeEditor />
          </div>

          {/* Drag to resize the editor vs. the test-cases panel (desktop only). */}
          <div
            onPointerDown={startDragY}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize test cases panel"
            className="hidden h-1.5 shrink-0 cursor-row-resize bg-zinc-800 transition-colors hover:bg-blue-500/60 md:block"
          />

          <div style={isDesktop ? { height: runHeight } : undefined} className="h-72 shrink-0">
            <RunPanel problem={problem} />
          </div>
        </section>
      </div>
    </div>
  );
}
