import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Non-fatal: the editor works without Supabase; auth + session saving won't.
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Auth and session saving are disabled until these are set in .env.local',
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '');
