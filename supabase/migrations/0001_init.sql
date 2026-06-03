-- Sessions table: one row per practice attempt, owned by the signed-in user.
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  problem_id  text not null,
  language    text not null,
  code        text,
  status      text not null default 'in_progress', -- in_progress | solved | abandoned
  duration_ms integer,
  keystrokes  jsonb not null default '[]',
  ai_review   jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists sessions_user_id_created_at_idx
  on public.sessions (user_id, created_at desc);

-- Row Level Security: a user can only ever see/modify their own sessions.
alter table public.sessions enable row level security;

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
