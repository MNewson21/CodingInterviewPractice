import { describe, it, expect } from 'vitest';
import { estimateComplexity } from './complexity';

describe('estimateComplexity — empty / trivial', () => {
  it('reports "-" with detail "empty" for blank code', () => {
    expect(estimateComplexity('', 'javascript')).toEqual({ label: '-', detail: 'empty' });
    expect(estimateComplexity('   \n  ', 'python')).toEqual({ label: '-', detail: 'empty' });
  });

  it('reports O(1) when there are no loops', () => {
    const est = estimateComplexity('return a + b;', 'javascript');
    expect(est.label).toBe('O(1)');
    expect(est.detail).toBe('no loops detected');
  });
});

describe('estimateComplexity — brace languages (loop nesting)', () => {
  it('detects a single loop as O(n)', () => {
    const code = 'for (let i = 0; i < n; i++) { sum += a[i]; }';
    expect(estimateComplexity(code, 'javascript').label).toBe('O(n)');
  });

  it('detects two nested loops as O(n²)', () => {
    const code = `
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          grid[i][j] = 0;
        }
      }`;
    const est = estimateComplexity(code, 'cpp');
    expect(est.label).toBe('O(n²)');
    expect(est.detail).toBe('2 nested loop levels');
  });

  it('detects three nested loops as O(n³)', () => {
    const code = `
      for (i) {
        for (j) {
          for (k) { x++; }
        }
      }`;
    expect(estimateComplexity(code, 'java').label).toBe('O(n³)');
  });

  it('falls back to O(n^k) beyond the lookup table', () => {
    const code = `
      for (a) { for (b) { for (c) { for (d) { x++; } } } }`;
    expect(estimateComplexity(code, 'javascript').label).toBe('O(n^4)');
  });

  it('does not nest sibling (non-nested) loops', () => {
    const code = `
      for (let i = 0; i < n; i++) { a[i]++; }
      for (let j = 0; j < n; j++) { b[j]++; }`;
    expect(estimateComplexity(code, 'javascript').label).toBe('O(n)');
  });
});

describe('estimateComplexity — Python (indentation nesting)', () => {
  it('detects a single loop as O(n)', () => {
    const code = ['for i in range(n):', '    total += nums[i]'].join('\n');
    expect(estimateComplexity(code, 'python').label).toBe('O(n)');
  });

  it('detects two nested loops as O(n²)', () => {
    const code = [
      'for i in range(n):',
      '    for j in range(n):',
      '        grid[i][j] = 0',
    ].join('\n');
    expect(estimateComplexity(code, 'python').label).toBe('O(n²)');
  });

  it('treats a dedented second loop as sibling, not nested', () => {
    const code = [
      'for i in range(n):',
      '    a[i] += 1',
      'for j in range(n):',
      '    b[j] += 1',
    ].join('\n');
    expect(estimateComplexity(code, 'python').label).toBe('O(n)');
  });
});

describe('estimateComplexity — sort heuristic', () => {
  it('upgrades a single-loop sort to O(n log n)', () => {
    const code = 'arr.sort((a, b) => a - b);\nfor (const x of arr) { use(x); }';
    const est = estimateComplexity(code, 'javascript');
    expect(est.label).toBe('O(n log n)');
    expect(est.detail).toBe('sort detected');
  });

  it.each([
    ['python', 'sorted(nums)'],
    ['java', 'Arrays.sort(nums);'],
    ['cpp', 'std::sort(v.begin(), v.end());'],
  ] as const)('recognises the %s sort idiom', (lang, snippet) => {
    expect(estimateComplexity(snippet, lang).label).toBe('O(n log n)');
  });

  it('does NOT downgrade a genuinely nested-loop sort below O(n²)', () => {
    const code = `
      arr.sort();
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) { x++; }
      }`;
    // depth 2 dominates: the sort heuristic only applies at depth <= 1.
    expect(estimateComplexity(code, 'javascript').label).toBe('O(n²)');
  });
});
