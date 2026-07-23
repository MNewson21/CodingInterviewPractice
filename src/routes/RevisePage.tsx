import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeSwitcher } from '../features/editor/ThemeSwitcher';
import { SiteFooter } from '../components/SiteFooter';
import { usePageTitle } from '../hooks/usePageTitle';
import { PATTERNS, TECHNIQUES, STRUCTURES, THEORY, type RevisionPattern } from '../content/revisionPatterns';

/**
 * Renders the currently selected pattern/ADT: what it is, when to reach for it, why it
 * works, a tiny code sketch, and example problems that link into a real session.
 */
function PatternCard({ pattern }: { pattern: RevisionPattern }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <header>
        <h3 className="text-lg font-semibold text-zinc-100">{pattern.name}</h3>
        <p className="mt-1 text-sm text-zinc-400">{pattern.oneLiner}</p>
      </header>

      <p className="mt-4 text-sm leading-relaxed text-zinc-300">{pattern.whatItIs}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Use it when</h4>
          <ul className="mt-2 space-y-1.5">
            {pattern.whenToUse.map((signal) => (
              <li key={signal} className="flex gap-2 text-sm leading-snug text-zinc-300">
                <span aria-hidden className="mt-0.5 text-emerald-500">›</span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-400">Why it works</h4>
          <p className="mt-2 text-sm leading-snug text-zinc-300">{pattern.whyItWorks}</p>
          <p className="mt-3 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-400">Complexity:</span> {pattern.complexity}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <span className="absolute right-2 top-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          {pattern.language ?? 'Python'}
        </span>
        <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 pt-7 text-xs leading-relaxed text-zinc-300">
          <code>{pattern.sketch}</code>
        </pre>
      </div>

      <div className="mt-4 border-t border-zinc-800 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Practice problems</h4>
        <ul className="mt-2 space-y-2">
          {pattern.examples.map((ex) => (
            <li key={ex.problemId} className="text-sm">
              <Link to={`/session/${ex.problemId}`} className="font-medium text-blue-400 hover:underline">
                {ex.title}
              </Link>
              <span className="text-zinc-500"> - {ex.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/** A single selectable topic button in the sidebar filter list. */
function FilterButton({
  pattern,
  active,
  onSelect,
}: {
  pattern: RevisionPattern;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pattern.id)}
      aria-pressed={active}
      className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
        active
          ? 'bg-emerald-500/15 font-semibold text-emerald-300 ring-1 ring-emerald-500/40'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
      }`}
    >
      {pattern.name}
    </button>
  );
}

/**
 * "Revise" page: a cheat-sheet of the core interview patterns (algorithmic techniques)
 * and abstract data types. A sticky sidebar lists every topic; clicking one shows only
 * that pattern in the panel beside it (default: Two Pointers). Linked from the home-page
 * header and the footer.
 */
export function RevisePage() {
  usePageTitle('Revise');
  const [selectedId, setSelectedId] = useState<string>('two-pointers');
  const selected = PATTERNS.find((p) => p.id === selectedId) ?? PATTERNS[0];

  const groups: { heading: string; items: RevisionPattern[] }[] = [
    { heading: 'Techniques', items: TECHNIQUES },
    { heading: 'Data structures (ADTs)', items: STRUCTURES },
    { heading: 'Theory', items: THEORY },
  ];

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Revise: patterns &amp; approaches</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Pick a topic to see what it is, when to reach for it, and problems to practice it on.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link to="/" className="text-sm text-blue-400 hover:underline">
              Back to problems
            </Link>
            <ThemeSwitcher />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Sticky topic filter - stays in view so you never scroll up to switch. */}
          <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-56 lg:shrink-0 lg:overflow-y-auto">
            {groups.map((group) => (
              <div key={group.heading} className="mb-4">
                <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {group.heading}
                </h2>
                <div className="space-y-1">
                  {group.items.map((pattern) => (
                    <FilterButton
                      key={pattern.id}
                      pattern={pattern}
                      active={pattern.id === selected.id}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Only the selected pattern is shown. */}
          <div className="min-w-0 flex-1">
            <PatternCard pattern={selected} />
            <div className="mt-6">
              <Link
                to={`/session/${selected.examples[0].problemId}`}
                className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Practice {selected.name}
              </Link>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
