import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Problem } from '../types/problem';
import { problems } from '../features/problems/problems.data';
import { useAuth, signOut } from '../lib/auth';
import { SessionHistory } from '../features/sessions/SessionHistory';
import { ImportDropzone } from '../features/problems/ImportDropzone';
import { ProblemForm } from '../features/problems/ProblemForm';
import { MyProblems } from '../features/problems/MyProblems';
import { ProblemList } from '../features/problems/ProblemList';
import { DeleteAccount } from '../features/auth/DeleteAccount';
import { LandingHero } from '../features/landing/LandingHero';
import { ThemeSwitcher } from '../features/editor/ThemeSwitcher';
import { useProblemsStore } from '../stores/useProblemsStore';
import { SiteFooter } from '../components/SiteFooter';
import { usePageTitle } from '../hooks/usePageTitle';

export function HomePage() {
  usePageTitle();
  const { user, loading } = useAuth();
  const loadCustom = useProblemsStore((s) => s.load);
  // null = show the import dropzone; otherwise the form is open in create or edit mode.
  const [form, setForm] = useState<{ kind: 'create' } | { kind: 'edit'; problem: Problem } | null>(null);
  // The landing hero's CTA scrolls the (logged-out) visitor down to the problem list.
  const listRef = useRef<HTMLDivElement>(null);
  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (user) loadCustom();
  }, [user, loadCustom]);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">CodingInterviewPractice</h1>
            {user && (
              <p className="mt-1 text-sm text-zinc-400">Welcome back - pick a problem to continue.</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-sm">
            <Link to="/revise" className="text-xs font-bold text-emerald-400 hover:text-emerald-300">
              Revise
            </Link>
            <Link to="/about" className="text-xs text-zinc-400 hover:text-zinc-100">
              Why did I build this?
            </Link>
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

        <div className="mt-3 flex justify-end">
          <ThemeSwitcher />
        </div>

        {!loading && !user && <LandingHero onTryProblem={scrollToList} />}

        <section ref={listRef} className="scroll-mt-4">
          <h2 className="mt-10 mb-3 text-sm font-semibold text-zinc-300">Problems</h2>
          <ProblemList problems={problems} />
        </section>

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

            {user.email && (
              <section className="mt-10">
                <h2 className="mb-3 text-sm font-semibold text-zinc-300">Account</h2>
                <DeleteAccount email={user.email} />
              </section>
            )}
          </>
        )}

        <SiteFooter />
      </div>
    </div>
  );
}
