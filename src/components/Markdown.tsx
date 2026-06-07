import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// Zinc-themed element overrides so markdown matches the rest of the app instead of
// relying on browser defaults. Kept small: the components we actually use in problem
// descriptions (headings, lists, inline + block code, links, emphasis, tables).
const components: Components = {
  h1: ({ children }) => <h1 className="mt-4 mb-2 text-base font-bold text-zinc-100">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 text-sm font-bold text-zinc-100">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1 text-sm font-semibold text-zinc-100">{children}</h3>,
  p: ({ children }) => <p className="my-2 text-zinc-200">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-inside list-disc space-y-1 text-zinc-200">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-inside list-decimal space-y-1 text-zinc-200">{children}</ol>,
  li: ({ children }) => <li className="text-zinc-200">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
  code: ({ className, children }) => {
    // react-markdown gives block code a language-* class; inline code has none.
    const isBlock = (className ?? '').includes('language-');
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs text-zinc-200">
          {children}
        </code>
      );
    }
    return <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-xs text-zinc-200">{children}</code>;
  },
  pre: ({ children }) => <pre className="my-2">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-zinc-700 pl-3 text-zinc-400">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-zinc-800 px-2 py-1 text-left font-semibold text-zinc-200">{children}</th>,
  td: ({ children }) => <td className="border border-zinc-800 px-2 py-1 text-zinc-300">{children}</td>,
};

/** Renders a markdown string with GitHub-flavored markdown and zinc-themed styling. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
