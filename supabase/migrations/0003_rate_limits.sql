-- Server-side rate limiting for the AI Edge Functions (ai-hint, ai-review).
-- Without this, the functions can be called as fast as a script can fire, burning
-- the LLM quota. We track a fixed-window counter per caller key (user id, or IP for
-- anonymous callers) and let the function decide allow/deny.

create table if not exists public.rate_limit_counters (
  key          text primary key,           -- e.g. 'ai-hint:user:<uuid>:w60'
  count        integer not null default 0,
  window_start timestamptz not null default now()
);

-- Only the service role (used by Edge Functions, bypasses RLS) may touch this table.
-- RLS is enabled with no policies so anon/auth clients cannot read or write it.
alter table public.rate_limit_counters enable row level security;

-- Atomically bump the counter for `p_key` and report whether the caller is still
-- under `p_max` within the rolling `p_window_seconds` window. The whole thing is a
-- single upsert so concurrent calls for the same key are serialised on the row lock.
create or replace function public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limit_counters as c (key, count, window_start)
    values (p_key, 1, now())
  on conflict (key) do update
    set
      count = case
        when c.window_start < now() - make_interval(secs => p_window_seconds) then 1
        else c.count + 1
      end,
      window_start = case
        when c.window_start < now() - make_interval(secs => p_window_seconds) then now()
        else c.window_start
      end
  returning c.count into v_count;

  return v_count <= p_max;
end;
$$;

-- Lock down execution to the service role only.
revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
