/**
 * Covers the form's `unordered` checkbox, which has been 0% covered since the judge
 * mode shipped - the only authoring path to a set-judged custom problem.
 *
 * The assertions are about what lands in `ProblemData`, not about markup: the draft is
 * assembled inline in `handleSubmit` and normalised by `parseProblemData`, so the
 * checkbox could be wired to nothing and a typecheck would not notice.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// The store -> api -> supabaseClient chain calls createClient() at import time, which
// needs a WebSocket global Node 20 does not expose. Neither is under test here.
vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: false, supabase: {} }));
vi.mock('./userProblems.api', () => ({
  listUserProblems: vi.fn(),
  saveUserProblem: vi.fn(),
  updateUserProblem: vi.fn(),
}));

import { ProblemForm } from './ProblemForm';
import { saveUserProblem, updateUserProblem } from './userProblems.api';
import type { ProblemData } from './problemFile';
import { useProblemsStore } from '../../stores/useProblemsStore';
import type { Problem } from '../../types/problem';

const mockSave = saveUserProblem as Mock;
const mockUpdate = updateUserProblem as Mock;

/** An existing set-judged problem, for the edit path. */
function existing(overrides: Partial<Problem> = {}): Problem {
  return {
    id: 'custom-1',
    title: 'Subsets',
    difficulty: 'medium',
    tags: ['backtracking'],
    description: 'Return all subsets.',
    examples: [],
    constraints: [],
    starterCode: {},
    judge: 'unordered',
    testCases: [{ name: 'example', stdin: '[1,2]', expectedStdout: '[[],[1],[2],[1,2]]' }],
    ...overrides,
  };
}

const checkbox = () => screen.getByRole('checkbox', { name: /any order/i }) as HTMLInputElement;

/** Fill the minimum the parser accepts: a title and one test case with an expected output. */
function fillMinimum() {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Subsets' } });
  fireEvent.change(screen.getByLabelText('expected output'), { target: { value: '[[],[1]]' } });
}

async function submit(label: RegExp) {
  fireEvent.click(screen.getByRole('button', { name: label }));
  await waitFor(() => expect(mockSave.mock.calls.length + mockUpdate.mock.calls.length).toBeGreaterThan(0));
}

/** The ProblemData the form actually sent, after `parseProblemData` normalised it. */
const sentTo = (m: Mock): ProblemData => m.mock.calls[0][m === mockUpdate ? 1 : 0] as ProblemData;

beforeEach(() => {
  mockSave.mockReset();
  mockUpdate.mockReset();
  mockSave.mockImplementation(async (data: ProblemData) => ({ id: 'saved-1', ...data }));
  mockUpdate.mockImplementation(async (id: string, data: ProblemData) => ({ id, ...data }));
  useProblemsStore.setState({ custom: [], loaded: false, loading: false, error: null });
});

afterEach(cleanup);

// ---- the unordered checkbox -----------------------------------------------

describe('the "any order" checkbox', () => {
  it('is off for a new problem', () => {
    render(<ProblemForm />);
    expect(checkbox().checked).toBe(false);
  });

  it('leaves judge unset when it is not ticked', async () => {
    render(<ProblemForm />);
    fillMinimum();
    await submit(/create problem/i);

    // `parseProblemData` omits the key entirely for the default mode, so an absent key -
    // not `judge: 'exact'` - is what a normal problem must store.
    expect(Object.keys(sentTo(mockSave))).not.toContain('judge');
  });

  it('declares judge: unordered when it is ticked', async () => {
    render(<ProblemForm />);
    fillMinimum();
    fireEvent.click(checkbox());
    expect(checkbox().checked).toBe(true);
    await submit(/create problem/i);

    expect(sentTo(mockSave).judge).toBe('unordered');
  });

  it('starts ticked when editing a problem already judged as a set', () => {
    render(<ProblemForm initial={existing()} />);
    expect(checkbox().checked).toBe(true);
  });

  it('keeps the mode when an unordered problem is saved unchanged', async () => {
    render(<ProblemForm initial={existing()} />);
    await submit(/save changes/i);

    expect(mockUpdate).toHaveBeenCalledWith('custom-1', expect.objectContaining({ judge: 'unordered' }));
  });

  it('drops the mode when it is un-ticked while editing', async () => {
    render(<ProblemForm initial={existing()} />);
    fireEvent.click(checkbox());
    expect(checkbox().checked).toBe(false);
    await submit(/save changes/i);

    // The reverse direction: turning the mode back off has to actually remove it.
    expect(Object.keys(sentTo(mockUpdate))).not.toContain('judge');
  });

  it('is cleared by "Clear form"', () => {
    render(<ProblemForm />);
    fireEvent.click(checkbox());
    fireEvent.click(screen.getByRole('button', { name: /clear form/i }));

    expect(checkbox().checked).toBe(false);
  });

  it('is off again for the next problem after a successful create', async () => {
    render(<ProblemForm />);
    fillMinimum();
    fireEvent.click(checkbox());
    await submit(/create problem/i);

    // reset() runs only on create; a sticky checkbox would silently mark the NEXT
    // problem as set-judged.
    await waitFor(() => expect(checkbox().checked).toBe(false));
  });
});

// ---- the surrounding submit path ------------------------------------------

describe('submitting the form', () => {
  it('adds the created problem to the store', async () => {
    render(<ProblemForm />);
    fillMinimum();
    await submit(/create problem/i);

    await waitFor(() => expect(useProblemsStore.getState().custom.map((p) => p.id)).toEqual(['saved-1']));
  });

  it('reports a validation failure instead of saving', async () => {
    render(<ProblemForm />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Subsets' } });
    // No test case filled in, so `parseProblemData` rejects the draft.
    fireEvent.click(screen.getByRole('button', { name: /create problem/i }));

    expect(await screen.findByText(/could not create/i)).toBeDefined();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('surfaces a save failure without clearing the form', async () => {
    mockSave.mockRejectedValue(new Error('You must be signed in to add a problem.'));
    render(<ProblemForm />);
    fillMinimum();
    fireEvent.click(screen.getByRole('button', { name: /create problem/i }));

    expect(await screen.findByText(/must be signed in/i)).toBeDefined();
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Subsets');
  });

  it('calls onDone after an edit is saved', async () => {
    const onDone = vi.fn();
    render(<ProblemForm initial={existing()} onDone={onDone} />);
    await submit(/save changes/i);

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});

// ---- field labelling ------------------------------------------------------

describe('field labelling', () => {
  /**
   * Regression guard: the per-test-case `stdin` and `expected output` labels used to
   * carry no `htmlFor` and did not wrap their textareas, so they named nothing - the
   * fields were unreachable by label for a screen reader and for these tests alike.
   */
  it('associates every labelled field with its control', () => {
    render(<ProblemForm />);
    for (const name of ['Title', 'Difficulty', 'Tags (comma-separated)', 'Description', 'stdin', 'expected output']) {
      const field = screen.getByLabelText(name);
      expect(field.tagName).toMatch(/^(INPUT|TEXTAREA|SELECT)$/);
    }
  });

  it('keeps the labels distinct when a second test case is added', () => {
    render(<ProblemForm />);
    fireEvent.click(screen.getByRole('button', { name: /add test case/i }));

    // Per-case ids must be unique, or getByLabelText resolves ambiguously.
    expect(screen.getAllByLabelText('stdin')).toHaveLength(2);
    expect(screen.getAllByLabelText('expected output')).toHaveLength(2);
  });

  /**
   * The repeated rows inside the Examples, Function arguments and Test cases
   * fieldsets were placeholder-only: no label, no `aria-label`, so they had no
   * accessible name at all. A placeholder is not a name, and it disappears the
   * moment a value is typed - exactly when a name is needed to re-orient.
   */
  it('names every control in the repeated example, argument and test-case rows', () => {
    render(<ProblemForm />);
    // A fresh form starts with no argument row (params defaults to []).
    fireEvent.click(screen.getByRole('button', { name: /add argument/i }));

    for (const name of [
      'Example 1 input',
      'Example 1 output',
      'Example 1 explanation',
      'Argument 1 name',
      'Test case 1 name',
    ]) {
      const field = screen.getByLabelText(name);
      expect(field.tagName).toMatch(/^(INPUT|TEXTAREA|SELECT)$/);
    }
  });

  it('numbers the row names so a second row stays distinguishable', () => {
    render(<ProblemForm />);
    for (const button of [/add example/i, /add argument/i, /add argument/i, /add test case/i]) {
      fireEvent.click(screen.getByRole('button', { name: button }));
    }

    // getByLabelText throws on an ambiguous match, so these pass only while the
    // index is part of each name.
    for (const name of [
      'Example 1 input',
      'Example 2 input',
      'Argument 1 name',
      'Argument 2 name',
      'Test case 1 name',
      'Test case 2 name',
    ]) {
      expect(screen.getByLabelText(name)).toBeDefined();
    }
  });

  /**
   * The visible labels inside a test-case row read plain 'stdin' / 'expected output',
   * so two cases produce two identically-named fields. The association is correct and
   * unique by id; only the name is ambiguous. Pinned here so a future fix is a
   * deliberate change rather than an accident.
   */
  it('still leaves the per-case stdin and expected-output names unnumbered', () => {
    render(<ProblemForm />);
    fireEvent.click(screen.getByRole('button', { name: /add test case/i }));

    expect(screen.getAllByLabelText('stdin')).toHaveLength(2);
    expect(screen.queryByLabelText('Test case 1 stdin')).toBeNull();
  });
});
