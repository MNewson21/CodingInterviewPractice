# Supabase Setup — Auth + Session Persistence

The app uses Supabase for sign-in and saving practice sessions.

## 1. Create a project
Go to https://supabase.com, create a free project, and grab from
**Project Settings -> API**:
- Project URL
- `anon` public key

## 2. Set env vars
In `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Restart `npm run dev` afterwards.

## 3. Run the migration
In the Supabase dashboard -> **SQL Editor**, paste and run the contents of
`supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_user_problems.sql`. This creates the `sessions` table and the
Row Level Security policy ("own sessions") so users only ever see their own data.

## 4. (Dev convenience) Disable email confirmation
For local testing without checking your inbox each time:
**Authentication -> Providers -> Email -> turn off "Confirm email"**.
Re-enable it for production.

## Notes
- RLS is the entire backend security model: every query is automatically scoped
  to `auth.uid()`. There is no server code to trust.
- The Anthropic key is NOT here — that lives in Supabase Edge Function secrets
  (Step 7), never in a `VITE_` variable.
