import type { Problem } from '../../types/problem';

const difficultyColor: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

export function ProblemPanel({ problem }: { problem: Problem }) {
  return (
    <div className="space-y-6 p-5 text-sm leading-relaxed">
      <div>
        <h2 className="text-lg font-bold">{problem.title}</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-xs uppercase ${difficultyColor[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          {problem.tags.map((t) => (
            <span key={t} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* v1 renders description as plain text. Upgrade to react-markdown later. */}
      <p className="whitespace-pre-wrap text-zinc-200">{problem.description}</p>

      <div>
        <h3 className="mb-2 font-semibold text-zinc-100">Examples</h3>
        <div className="space-y-3">
          {problem.examples.map((ex, i) => (
            <div
              key={i}
              className="overflow-x-auto rounded border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs"
            >
              <div>
                <span className="text-zinc-500">Input: </span>
                {ex.input}
              </div>
              <div>
                <span className="text-zinc-500">Output: </span>
                {ex.output}
              </div>
              {ex.explanation && <div className="mt-1 text-zinc-400">{ex.explanation}</div>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-zinc-100">Constraints</h3>
        <ul className="list-inside list-disc space-y-1 text-zinc-300">
          {problem.constraints.map((c, i) => (
            <li key={i} className="font-mono text-xs">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
