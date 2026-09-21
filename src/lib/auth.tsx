import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface AuthState {
  user: User | null;
  /** True until the initial session lookup resolves. */
  loading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Fold an incoming auth user into the current state, keeping the PREVIOUS `user` object
 * when the id is unchanged. Supabase emits a fresh `User` instance per event, and a new
 * object identity re-triggers every consumer effect keyed on `[user]` - so returning
 * `prev` unchanged is what actually stops the duplicate fetches. Exported for tests.
 */
export function nextAuthState(prev: AuthState, next: User | null): AuthState {
  return prev.user?.id === next?.id && !prev.loading ? prev : { user: next, loading: false };
}

/**
 * Owns the app's single Supabase auth subscription.
 *
 * Previously {@link useAuth} held local state, so each of its ~9 callers opened its own
 * `getSession()` + `onAuthStateChange` pair. Worse, supabase hands back a NEW `User`
 * object on every event (INITIAL_SESSION, TOKEN_REFRESHED, ...), so effects keyed on
 * `[user]` - the solved-ids and custom-problem fetches - re-ran on identity change rather
 * than on the user actually changing, multiplying requests on every page load.
 *
 * One provider fixes both halves: one subscription, and a `user` reference that only
 * changes when the user id does.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    // Both the initial lookup and the subscription funnel through here, so neither can
    // race the other into handing out a fresh-but-equivalent object.
    const apply = (next: User | null) => {
      if (cancelled) return;
      setState((prev) => nextAuthState(prev, next));
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      apply(session?.user ?? null),
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

/** The current Supabase auth user. Must be called inside {@link AuthProvider}. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Permanently deletes the signed-in user's account and all their data (UK GDPR right
 * to erasure). The `delete-account` Edge Function does the work server-side with the
 * service_role key (the browser can't delete an auth user). On success we sign out so
 * the now-deleted session is cleared locally.
 */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const payload = await context.json();
        if (payload?.error) throw new Error(payload.error);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message) throw parseErr;
      }
    }
    throw new Error(error.message);
  }
  if (data?.error) throw new Error(data.error);
  await supabase.auth.signOut();
}


/**
 * Starts an OAuth sign-in flow. Supabase redirects the browser to the provider,
 * then back to `redirectTo` once the session is established. `useAuth()` picks up
 * the resulting session automatically via `onAuthStateChange`.
 */
export async function signInWithProvider(provider: 'google' | 'github'): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
}

export function signInWithGoogle(): Promise<void> {
  return signInWithProvider('google');
}

export function signInWithGitHub(): Promise<void> {
  return signInWithProvider('github');
}