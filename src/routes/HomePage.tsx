import { Link } from 'react-router-dom';
import { problems } from '../features/problems/problems.data';

const difficultyColor: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

export function HomePage() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold">Mock Interview IDE</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Pick a problem to start a practice session.
        </p>
        <ul className="mt-6 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {problems.map((p) => (
            <li key={p.id}>
              <Link
                to={`/session/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900"
              >
                <span className="font-medium">{p.title}</span>
                <span className={`text-xs uppercase ${difficultyColor[p.difficulty]}`}>
                  {p.difficulty}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
