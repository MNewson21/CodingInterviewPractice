import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProblem } from '../features/problems/problems.data';
import { ProblemPanel } from '../features/problems/ProblemPanel';
import { CodeEditor } from '../features/editor/CodeEditor';
import { LanguageSelect } from '../features/editor/LanguageSelect';
import { Timer } from '../features/timer/Timer';
import { RunPanel } from '../features/execution/RunPanel';
import { useEditorStore } from '../stores/useEditorStore';
import { useTimerStore } from '../stores/useTimerStore';
import { useExecutionStore } from '../stores/useExecutionStore';

export function SessionPage() {
  const { problemId } = useParams();
  const problem = problemId ? getProblem(problemId) : undefined;
  const language = useEditorStore((s) => s.language);
  const setCode = useEditorStore((s) => s.setCode);
  const resetTimer = useTimerStore((s) => s.reset);
  const resetExecution = useExecutionStore((s) => s.reset);

  // Reset editor, timer and results when the problem changes.
  useEffect(() => {
    if (problem) {
      setCode(problem.starterCode[language] ?? '');
      resetTimer();
      resetExecution();
    }
    // language switches are handled in LanguageSelect, so only depend on the problem id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id]);

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
