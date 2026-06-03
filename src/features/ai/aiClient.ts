import { supabase } from '../../lib/supabaseClient';
import type { HintResponse, ReviewResponse } from '../../types/ai';

export async function fetchHint(input: {
  title: string;
  description: string;
  language: string;
  code: string;
  level: number;
  priorHints: string[];
}): Promise<HintResponse> {
  const { data, error } = await supabase.functions.invoke('ai-hint', { body: input });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as HintResponse;
}

export async function fetchReview(input: {
  title: string;
  description: string;
  language: string;
  code: string;
  testSummary: string;
}): Promise<ReviewResponse> {
  const { data, error } = await supabase.functions.invoke('ai-review', { body: input });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as ReviewResponse;
}
