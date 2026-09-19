import { describe, it, expect, vi } from 'vitest';

// tracks.data -> problems.data -> useProblemsStore -> userProblems.api -> supabaseClient,
// whose createClient() call needs a WebSocket global that Node 20 does not expose. None of
// that is under test here - the tracks module only reads the static built-in catalog - so
// the client is stubbed to keep the import chain from constructing a realtime socket.
vi.mock('../../lib/supabaseClient', () => ({
  isSupabaseConfigured: false,
  supabase: {},
}));

import { TRACKS, getTrack, trackProblems } from './tracks.data';
import { problems } from '../problems/problems.data';

// ---- catalog-wide invariants ----------------------------------------------

describe('TRACKS', () => {
  it('has unique track ids', () => {
    const ids = TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only problem ids that exist in the catalog', () => {
    const known = new Set(problems.map((p) => p.id));
    const dangling = TRACKS.flatMap((t) =>
      t.problemIds.filter((id) => !known.has(id)).map((id) => `${t.id} -> ${id}`),
    );
    expect(dangling).toEqual([]);
  });

  it('lists no problem twice within a single track', () => {
    const dupes = TRACKS.flatMap((t) =>
      t.problemIds
        .filter((id, i) => t.problemIds.indexOf(id) !== i)
        .map((id) => `${t.id} -> ${id}`),
    );
    expect(dupes).toEqual([]);
  });
});

// ---- Demon List ------------------------------------------------------------

describe('Demon List', () => {
  const demon = getTrack('demon-list');

  it('exists', () => {
    expect(demon).toBeDefined();
  });

  /**
   * The track's whole premise is "the hardest problems on the site", so it must stay a
   * complete view of the hard tier. This fails loudly when a hard problem is added to the
   * catalog and not ranked here - which is the point: the ranking is a judgement call and
   * should be made deliberately, not defaulted to the bottom of the list.
   */
  it('contains exactly the catalog’s hard problems', () => {
    const hard = problems.filter((p) => p.difficulty === 'hard').map((p) => p.id);
    expect([...demon!.problemIds].sort()).toEqual([...hard].sort());
  });

  it('resolves every id, so the rendered order matches the authored ranking', () => {
    const resolved = trackProblems(demon!);
    expect(resolved.map((p) => p.id)).toEqual(demon!.problemIds);
  });

  it('is ordered hardest first, opening on Super Egg Drop', () => {
    expect(demon!.problemIds[0]).toBe('super-egg-drop');
  });
});
