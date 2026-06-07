import { supabase } from '../../lib/supabaseClient';
import type { HintResponse, ReviewResponse } from '../../types/ai';

/**
 * Invoke an Edge Function and surface a clean error message. On a non-2xx response
 * (e.g. a 429 rate limit) supabase-js sets `error` and leaves `data` null, with the
 * JSON body on `error.context` (a Response) — so we read our `{ error }` payload from
 * there to show the real reason instead of a generic "non-2xx status code".
 */
async function invokeAi<T>(fn: 'ai-hint' | 'ai-review', body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
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
  return data as T;
}

export function fetchHint(input: {
  title: string;
  description: string;
  language: string;
  code: string;
  level: number;
  priorHints: string[];
}): Promise<HintResponse> {
  return invokeAi<HintResponse>('ai-hint', input);
}

export function fetchReview(input: {
  title: string;
  description: string;
  language: string;
  code: string;
  testSummary: string;
}): Promise<ReviewResponse> {
  return invokeAi<ReviewResponse>('ai-review', input);
}
