import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // Non-fatal: the editor works without Supabase; auth + session saving won't.
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Auth and session saving are disabled until these are set in .env.local (note the leading dot).',
  );
}

// Use valid placeholders when unconfigured so createClient never throws at import
// time (an empty URL throws and would blank-screen the whole app). Calls made
// against the placeholder simply fail and are handled by the UI.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
);
