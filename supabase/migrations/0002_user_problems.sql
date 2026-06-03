-- User-created problems: one row per problem, owned by the signed-in user.
-- The full Problem JSON (minus its id) lives in `data`; the row id IS the problem id.
create table if not exists public.user_problems (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists user_problems_user_id_created_at_idx
  on public.user_problems (user_id, created_at desc);

alter table public.user_problems enable row level security;

drop policy if exists "own problems" on public.user_problems;
create policy "own problems" on public.user_problems
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
