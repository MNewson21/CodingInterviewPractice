import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateRule {
  /** Max requests allowed within the window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RateLimitOutcome {
  allowed: boolean;
  /** Seconds the caller should wait before retrying (the window of the rule that tripped). */
  retryAfter: number;
}

/**
 * Fixed-window rate limit enforced server-side via the `check_rate_limit` Postgres
 * function. Keyed by the authenticated user id when present, otherwise by source IP,
 * so signed-out callers are limited too. Multiple rules let us combine a tight
 * per-minute cap with a looser per-hour cap.
 *
 * Fails OPEN: if Supabase env/secrets are missing or the RPC errors, we allow the
 * request rather than block legitimate users on an infrastructure hiccup.
 */
export async function checkRateLimit(
  req: Request,
  name: string,
  rules: RateRule[],
): Promise<RateLimitOutcome> {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return { allowed: true, retryAfter: 0 };

  const admin = createClient(url, serviceKey);

  // Identify the caller: prefer the authenticated user, fall back to source IP.
  let identity = 'anon';
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data } = await admin.auth.getUser(token);
    if (data.user) identity = `user:${data.user.id}`;
  }
  if (identity === 'anon') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    identity = `ip:${ip}`;
  }

  for (const rule of rules) {
    const key = `${name}:${identity}:w${rule.windowSeconds}`;
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: key,
      p_max: rule.max,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) continue; // fail open on this rule
    if (data !== true) return { allowed: false, retryAfter: rule.windowSeconds };
  }

  return { allowed: true, retryAfter: 0 };
}
