import { Link } from 'react-router-dom';
import type { Problem } from '../../types/problem';
import { useProblemsStore } from '../../stores/useProblemsStore';
import { downloadProblem } from './problemFile';
import { deleteUserProblem } from './userProblems.api';

const difficultyColor: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

export function MyProblems({ onEdit }: { onEdit?: (p: Problem) => void }) {
  const custom = useProblemsStore((s) => s.custom);
  const loaded = useProblemsStore((s) => s.loaded);
  const loading = useProblemsStore((s) => s.loading);
  const error = useProblemsStore((s) => s.error);
  const removeCustom = useProblemsStore((s) => s.removeCustom);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this problem?')) return;
    try {
      await deleteUserProblem(id);
      removeCustom(id);
    } catch {
      // non-fatal; leave the row in place
    }
  }

  if (error) return <p className="text-xs text-red-400">Could not load your problems: {error}</p>;
  if (!loaded && loading) return <p className="text-xs text-zinc-600">Loading your problems…</p>;
  if (custom.length === 0) {
    return <p className="text-xs text-zinc-600">No custom problems yet. Drop a .json above to add one.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
      {custom.map((p) => (
        <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
          <Link to={`/session/${p.id}`} className="font-medium hover:underline">
            {p.title}
          </Link>
          <div className="flex items-center gap-3">
            <span className={`text-xs uppercase ${difficultyColor[p.difficulty] ?? 'text-zinc-400'}`}>
              {p.difficulty}
            </span>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="text-xs text-emerald-400 hover:underline"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => downloadProblem(p)}
              className="text-xs text-blue-400 hover:underline"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => handleDelete(p.id)}
              className="text-xs text-zinc-500 hover:text-red-400"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
