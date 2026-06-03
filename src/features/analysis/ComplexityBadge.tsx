import { useMemo } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { estimateComplexity } from './complexity';

export function ComplexityBadge() {
  const code = useEditorStore((s) => s.code);
  const language = useEditorStore((s) => s.language);
  const est = useMemo(() => estimateComplexity(code, language), [code, language]);

  return (
    <div
      className="flex items-center gap-2 border-b border-zinc-800 px-3 py-1 text-xs text-zinc-400"
      title="Heuristic estimate based on loop nesting only. Ignores recursion, hidden built-in costs, and fixed bounds."
    >
      <span className="text-zinc-500">Est. complexity:</span>
      <span className="font-mono text-zinc-200">{est.label}</span>
      <span className="text-zinc-600">· {est.detail} · rough estimate</span>
    </div>
  );
}
