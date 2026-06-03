import { supabase } from '../../lib/supabaseClient';
import type { Language } from '../../types/problem';
import type { KeystrokeEvent, SessionRecord, SessionStatus } from '../../types/session';

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

export async function saveSession(input: SaveSessionInput): Promise<SessionRecord> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('You must be signed in to save a session.');

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      problem_id: input.problemId,
      language: input.language,
      code: input.code,
      status: input.status,
      duration_ms: input.durationMs,
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
  const { data, error } = await supabase
    .from('sessions')
    .update({
      language: input.language,
      code: input.code,
      status: input.status,
      duration_ms: input.durationMs,
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

export async function getSession(id: string): Promise<SessionRecord | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? fromRow(data as SessionRow) : null;
}
