import type { Language } from '../../types/problem';

export interface ComplexityEstimate {
  label: string;
  detail: string;
}

const POW = ['O(1)', 'O(n)', 'O(n²)', 'O(n³)'];

// Brace languages: estimate max loop-nesting by matching for/while keywords to the
// next `{` block. Rough - ignores strings/comments and single-statement loops.
function maxLoopNestingBrace(code: string): number {
  type Ev = { i: number; type: 'loop' | 'open' | 'close' };
  const events: Ev[] = [];
  for (const m of code.matchAll(/\b(for|while)\b/g)) events.push({ i: m.index ?? 0, type: 'loop' });
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '{') events.push({ i, type: 'open' });
    else if (code[i] === '}') events.push({ i, type: 'close' });
  }
  events.sort((a, b) => a.i - b.i);

  const stack: boolean[] = [];
  let pending = false;
  let max = 0;
  for (const e of events) {
    if (e.type === 'loop') pending = true;
    else if (e.type === 'open') {
      stack.push(pending);
      pending = false;
      const depth = stack.filter(Boolean).length;
      if (depth > max) max = depth;
    } else {
      stack.pop();
    }
  }
  return max;
}

// Python: estimate nesting via indentation of for/while lines.
function maxLoopNestingPython(code: string): number {
  const loopIndents: number[] = [];
  let max = 0;
  for (const line of code.split('\n')) {
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    while (loopIndents.length && indent <= loopIndents[loopIndents.length - 1]) loopIndents.pop();
    if (/^\s*(for|while)\b/.test(line)) {
      loopIndents.push(indent);
      if (loopIndents.length > max) max = loopIndents.length;
    }
  }
  return max;
}

export function estimateComplexity(code: string, language: Language): ComplexityEstimate {
  if (!code.trim()) return { label: '-', detail: 'empty' };

  const depth = language === 'python' ? maxLoopNestingPython(code) : maxLoopNestingBrace(code);
  const hasSort = /\bsorted\s*\(|Arrays\.sort|std::sort|\.sort\s*\(/.test(code);

  let label = depth < POW.length ? POW[depth] : `O(n^${depth})`;
  let detail = depth === 0 ? 'no loops detected' : `${depth} nested loop level${depth > 1 ? 's' : ''}`;

  if (hasSort && depth <= 1) {
    label = 'O(n log n)';
    detail = 'sort detected';
  }
  return { label, detail };
}
