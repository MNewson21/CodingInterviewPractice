import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Problem } from '../types/problem';
import { problems } from '../features/problems/problems.data';
import { useAuth, signOut } from '../lib/auth';
import { SessionHistory } from '../features/sessions/SessionHistory';
import { ImportDropzone } from '../features/problems/ImportDropzone';
import { ProblemForm } from '../features/problems/ProblemForm';
import { MyProblems } from '../features/problems/MyProblems';
import { useProblemsStore } from '../stores/useProblemsStore';

const difficultyColor: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

export function HomePage() {
  const { user, loading } = useAuth();
  const loadCustom = useProblemsStore((s) => s.load);
  // null = show the import dropzone; otherwise the form is open in create or edit mode.
  const [form, setForm] = useState<{ kind: 'create' } | { kind: 'edit'; problem: Problem } | null>(null);

  useEffect(() => {
    if (user) loadCustom();
  }, [user, loadCustom]);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mock Interview IDE</h1>
            <p className="mt-1 text-sm text-zinc-400">Pick a problem to start a practice session.</p>
          </div>
          <div className="text-right text-sm">
            {loading ? null : user ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-zinc-400">{user.email}</span>
                <button type="button" onClick={() => signOut()} className="text-xs text-zinc-400 hover:text-zinc-100">
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/auth" className="text-sm text-blue-400 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>

        <ul className="mt-6 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {problems.map((p) => (
            <li key={p.id}>
              <Link
                to={`/session/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900"
              >
                <span className="font-medium">{p.title}</span>
                <span className={`text-xs uppercase ${difficultyColor[p.difficulty]}`}>{p.difficulty}</span>
              </Link>
            </li>
          ))}
        </ul>

        {user && (
          <>
            <section className="mt-10">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">Your problems</h2>
                <button
                  type="button"
                  onClick={() => setForm((f) => (f?.kind === 'create' ? null : { kind: 'create' }))}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  {form?.kind === 'create' ? 'Close' : '+ Create a problem'}
                </button>
              </div>
              {form ? (
                <ProblemForm
                  key={form.kind === 'edit' ? form.problem.id : 'new'}
                  initial={form.kind === 'edit' ? form.problem : undefined}
                  onDone={() => setForm(null)}
                />
              ) : (
                <ImportDropzone />
              )}
              <div className="mt-3">
                <MyProblems onEdit={(p) => setForm({ kind: 'edit', problem: p })} />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="mb-3 text-sm font-semibold text-zinc-300">Your recent sessions</h2>
              <SessionHistory />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
