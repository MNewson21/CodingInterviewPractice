import { describe, it, expect, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

// createClient() runs at import time in supabaseClient and throws under Node 20.
vi.mock('./supabaseClient', () => ({ isSupabaseConfigured: false, supabase: {} }));

const { nextAuthState } = await import('./auth');
type AuthState = { user: User | null; loading: boolean };

/** Supabase returns a fresh User object per event; these stand in for two such objects. */
function user(id: string): User {
  return { id, email: `${id}@example.com` } as User;
}

describe('nextAuthState', () => {
  it('resolves loading on the first result, even when signed out', () => {
    const prev = { user: null, loading: true };
    expect(nextAuthState(prev, null)).toEqual({ user: null, loading: false });
  });

  it('adopts the user on the first result', () => {
    const u = user('abc');
    expect(nextAuthState({ user: null, loading: true }, u)).toEqual({ user: u, loading: false });
  });

  // The crux of the fix: a redundant event carrying an equal-but-distinct User object
  // must return the SAME state object, or every `[user]` effect re-fires and refetches.
  it('keeps the previous object when a later event repeats the same id', () => {
    const prev = { user: user('abc'), loading: false };
    const result = nextAuthState(prev, user('abc'));
    expect(result).toBe(prev);
    expect(result.user).toBe(prev.user);
  });

  it('is stable across repeated redundant events', () => {
    const prev: AuthState = { user: user('abc'), loading: false };
    let state: AuthState = prev;
    for (let i = 0; i < 5; i++) state = nextAuthState(state, user('abc'));
    expect(state).toBe(prev);
  });

  it('stays stable while signed out', () => {
    const prev = { user: null, loading: false };
    expect(nextAuthState(prev, null)).toBe(prev);
  });

  it('updates when a different user signs in', () => {
    const prev = { user: user('abc'), loading: false };
    const next = user('xyz');
    expect(nextAuthState(prev, next)).toEqual({ user: next, loading: false });
  });

  it('updates on sign-out', () => {
    const prev = { user: user('abc'), loading: false };
    expect(nextAuthState(prev, null)).toEqual({ user: null, loading: false });
  });

  // Guards the `!prev.loading` half: while still loading, an equal id must NOT short-
  // circuit, or `loading` would never flip to false and the UI would hang on "Loading…".
  it('does not short-circuit while still loading', () => {
    const u = user('abc');
    const prev = { user: u, loading: true };
    const result = nextAuthState(prev, u);
    expect(result).not.toBe(prev);
    expect(result.loading).toBe(false);
  });
});
