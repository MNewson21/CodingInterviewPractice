-- Shareable replays: let a user opt a single session into public, read-only access
-- via its unguessable UUID. Everything stays private by default; sharing is explicit
-- and revocable by flipping is_public back off.

alter table public.sessions
  add column if not exists is_public boolean not null default false;

-- Anonymous (and other signed-in) visitors may SELECT a session ONLY when the owner
-- has marked it public. The owner's own "own sessions" policy (0001) is untouched, so
-- private sessions remain invisible to everyone but their owner.
drop policy if exists "public shared sessions" on public.sessions;
create policy "public shared sessions" on public.sessions
  for select
  to anon, authenticated
  using (is_public);

-- RLS controls which *rows* are visible; column-level grants control which *columns*.
-- Together they ensure a link-holder can read only the replay-relevant fields of a
-- shared row — never user_id (owner identity) or ai_review (private feedback).
revoke select on public.sessions from anon;
grant select (id, problem_id, language, code, status, duration_ms, keystrokes, created_at, is_public)
  on public.sessions to anon;
