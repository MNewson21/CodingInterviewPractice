import { supabase } from '../../lib/supabaseClient';
import type { Problem } from '../../types/problem';
import type { ProblemData } from './problemFile';

interface UserProblemRow {
  id: string;
  user_id: string;
  data: ProblemData;
  created_at: string;
}

// The row id becomes the problem id.
function fromRow(r: UserProblemRow): Problem {
  return { id: r.id, ...r.data };
}

export async function listUserProblems(): Promise<Problem[]> {
  const { data, error } = await supabase
    .from('user_problems')
    .select()
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as UserProblemRow[]).map(fromRow);
}

export async function saveUserProblem(data: ProblemData): Promise<Problem> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('You must be signed in to add a problem.');

  const { data: row, error } = await supabase
    .from('user_problems')
    .insert({ user_id: userId, data })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return fromRow(row as UserProblemRow);
}

export async function deleteUserProblem(id: string): Promise<void> {
  const { error } = await supabase.from('user_problems').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
