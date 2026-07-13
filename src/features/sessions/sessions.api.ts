import { supabase } from '../../lib/supabaseClient';
import type { Language } from '../../types/problem';
import type {
  KeystrokeEvent,
  SessionRecord,
  SessionStatus,
  SharedReplay,
} from '../../types/session';

// DB rows are snake_case; the app uses camelCase. Map at this boundary.
interface SessionRow {
  id: string;
  user_id: string;
  problem_id: string;
  language: string;
  code: string | null;
  status: SessionStatus;
  duration_ms: number | null;
  keystrokes: KeystrokeEvent[] | null;
  ai_review: unknown | null;
  created_at: string;
  is_public: boolean;
}

function fromRow(r: SessionRow): SessionRecord {
  return {
    id: r.id,
    userId: r.user_id,
    problemId: r.problem_id,
    language: r.language as Language,
    code: r.code,
    status: r.status,
    durationMs: r.duration_ms,
    keystrokes: r.keystrokes ?? [],
    aiReview: r.ai_review,
    createdAt: r.created_at,
    isPublic: r.is_public ?? false,
  };
}

export interface SaveSessionInput {
  problemId: string;
  language: Language;
  code: string;
  status: SessionStatus;
  durationMs: number;
  keystrokes?: KeystrokeEvent[];
}

/**
 * Above this serialized size we drop the keystroke log from a save so the row still
 * persists. Replay is the expendable part of a session; the code/progress is not.
 * Postgres handles large jsonb, but multi-MB payloads get slow and can hit request
 * limits - a long pair-programming-length session can accrue tens of thousands of events.
 */
export const MAX_KEYSTROKES_BYTES = 3_000_000; // ~3 MB

/** Rough byte size of the serialized keystroke log (UTF-16 length ≈ bytes for typical code). */
export function keystrokesByteSize(events: KeystrokeEvent[]): number {
  return JSON.stringify(events).length;
}

/** Thrown when a save/update is attempted without a valid session (signed out / token expired). */
export class AuthRequiredError extends Error {
  constructor(message = 'You must be signed in to save a session.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

/** Resolve the current user id, or throw AuthRequiredError if the session is gone/expired. */
async function requireUserId(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new AuthRequiredError();
  return userId;
}

export async function saveSession(input: SaveSessionInput): Promise<SessionRecord> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      problem_id: input.problemId,
      language: input.language,
      code: input.code,
      status: input.status,
      // duration_ms is an integer column; the timer accumulates fractional ms from
      // performance.now() deltas, so round before writing or Postgres rejects the float.
      duration_ms: Math.round(input.durationMs),
      keystrokes: input.keystrokes ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data as SessionRow);
}

/** Update an existing session in place (used when resuming/editing a saved attempt). */
export async function updateSession(
  id: string,
  input: SaveSessionInput,
): Promise<SessionRecord> {
  // Guard explicitly: without a session, RLS silently matches no rows and .single()
  // would throw a cryptic "no rows" error instead of a clear "please sign in".
  await requireUserId();

  const { data, error } = await supabase
    .from('sessions')
    .update({
      language: input.language,
      code: input.code,
      status: input.status,
      // duration_ms is an integer column; the timer accumulates fractional ms from
      // performance.now() deltas, so round before writing or Postgres rejects the float.
      duration_ms: Math.round(input.durationMs),
      keystrokes: input.keystrokes ?? [],
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data as SessionRow);
}

export async function listSessions(): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select()
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as SessionRow[]).map(fromRow);
}

/** Permanently delete one of the caller's saved sessions. RLS ensures only own rows match. */
export async function deleteSession(id: string): Promise<void> {
  // Guard explicitly so a signed-out caller gets a clear error rather than a silent
  // no-op (RLS would match zero rows and the delete would appear to "succeed").
  await requireUserId();

  const { error } = await supabase.from('sessions').delete().eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getSession(id: string): Promise<SessionRecord | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? fromRow(data as SessionRow) : null;
}

/**
 * Toggle whether a session is publicly shareable. Owner-only: RLS scopes the UPDATE to
 * the caller's rows, but we guard auth explicitly so a signed-out caller gets a clear
 * error instead of a silent zero-row no-op.
 */
export async function setSessionPublic(id: string, isPublic: boolean): Promise<void> {
  await requireUserId();

  const { error } = await supabase
    .from('sessions')
    .update({ is_public: isPublic })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Fetch the public, read-only view of a shared session - readable by anyone with the
 * link (including signed-out visitors). Only the columns granted to `anon` in migration
 * 0004 are selected; user_id and ai_review are never exposed. Returns null when the id
 * doesn't exist or hasn't been shared.
 */
export async function getSharedReplay(id: string): Promise<SharedReplay | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, problem_id, language, code, status, duration_ms, keystrokes, created_at')
    .eq('id', id)
    .eq('is_public', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const r = data as Omit<SessionRow, 'user_id' | 'ai_review' | 'is_public'>;
  return {
    id: r.id,
    problemId: r.problem_id,
    language: r.language as Language,
    code: r.code,
    status: r.status,
    durationMs: r.duration_ms,
    keystrokes: r.keystrokes ?? [],
    createdAt: r.created_at,
  };
}
