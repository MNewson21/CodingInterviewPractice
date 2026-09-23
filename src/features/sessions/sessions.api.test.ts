import { describe, it, expect, vi, beforeEach } from 'vitest';

// `lib/supabaseClient` calls createClient() at module load, which throws under Node 20
// (no WebSocket global). Mock it before importing anything that reaches it.
const order = vi.fn<(column: string, opts: { ascending: boolean }) => unknown>();
const select = vi.fn((_columns?: string) => ({ order }));
const from = vi.fn((_table: string) => ({ select }));

vi.mock('../../lib/supabaseClient', () => ({
  isSupabaseConfigured: false,
  supabase: { from },
}));

const { listSessionSummaries, summaryFromRow } = await import('./sessions.api');

/** A metadata row as PostgREST returns it for the summary column list. */
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sess-1',
    problem_id: 'two-sum',
    language: 'python',
    status: 'solved',
    duration_ms: 60_000,
    created_at: '2026-01-02T03:04:05.000Z',
    is_public: false,
    keystroke_count: 12,
    ...overrides,
  };
}

beforeEach(() => {
  from.mockClear();
  select.mockClear();
  order.mockClear();
  order.mockResolvedValue({ data: [row()], error: null });
});

describe('listSessionSummaries', () => {
  it('selects an explicit column list, never the whole row', async () => {
    await listSessionSummaries();
    expect(select).toHaveBeenCalledTimes(1);
    expect(typeof select.mock.calls[0]![0]).toBe('string');
  });

  // The entire point of this function: `keystrokes` is a jsonb log allowed to reach
  // ~3 MB per row, and listing pages were downloading it to draw badges and links.
  it('never requests the keystrokes column', async () => {
    await listSessionSummaries();
    expect(select.mock.calls[0]![0]).not.toContain('keystrokes');
  });

  it('does not request code or ai_review either', async () => {
    await listSessionSummaries();
    const columns = select.mock.calls[0]![0]!;
    expect(columns).not.toContain('code');
    expect(columns).not.toContain('ai_review');
  });

  it('requests every column the SessionSummary shape needs', async () => {
    await listSessionSummaries();
    const columns = select.mock.calls[0]![0]!.split(',').map((c) => c.trim());
    expect(columns.sort()).toEqual(
      [
        'created_at',
        'duration_ms',
        'id',
        'is_public',
        'keystroke_count',
        'language',
        'problem_id',
        'status',
      ].sort(),
    );
  });

  it('reads from the sessions table, newest first', async () => {
    await listSessionSummaries();
    expect(from).toHaveBeenCalledWith('sessions');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('maps snake_case rows to the camelCase summary shape', async () => {
    const [summary] = await listSessionSummaries();
    expect(summary).toEqual({
      id: 'sess-1',
      problemId: 'two-sum',
      language: 'python',
      status: 'solved',
      durationMs: 60_000,
      createdAt: '2026-01-02T03:04:05.000Z',
      isPublic: false,
      keystrokeCount: 12,
    });
  });

  it('throws the PostgREST error message when the query fails', async () => {
    order.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    await expect(listSessionSummaries()).rejects.toThrow('permission denied');
  });
});

describe('summaryFromRow', () => {
  // A missing or ungranted column arrives as null/undefined; it must not render a
  // Replay link to an empty player, so it degrades to "not replayable".
  it('treats a null keystroke_count as zero', () => {
    expect(summaryFromRow(row({ keystroke_count: null }) as never).keystrokeCount).toBe(0);
  });

  it('treats a null is_public as false', () => {
    expect(summaryFromRow(row({ is_public: null }) as never).isPublic).toBe(false);
  });

  it('preserves a null duration rather than coercing it to zero', () => {
    expect(summaryFromRow(row({ duration_ms: null }) as never).durationMs).toBeNull();
  });
});
