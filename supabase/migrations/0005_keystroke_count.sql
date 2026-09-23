-- Listing pages (home, tracks, progress, session history) only need session METADATA,
-- but `keystrokes` is a jsonb log the app allows to grow to ~3 MB per row. Selecting it
-- just to derive solved badges or a "Replay" link downloaded megabytes per page load.
--
-- `keystroke_count` is the only thing those pages actually wanted from the blob: whether
-- a session has a replay. Storing it as a generated column lets the client select cheap
-- metadata and leave the log on the server. `jsonb_array_length` is IMMUTABLE, so it is
-- valid in a STORED generated expression; `keystrokes` is `not null default '[]'` and the
-- app only ever writes arrays, so the expression is always well-defined.
alter table public.sessions
  add column if not exists keystroke_count integer
  generated always as (jsonb_array_length(keystrokes)) stored;

-- Deliberately NOT granted to `anon`: migration 0004 pins the anonymous column list to the
-- replay-relevant fields, and a shared-replay viewer reads `keystrokes` itself. Owners read
-- this column as `authenticated`, which holds a table-level grant covering new columns.
