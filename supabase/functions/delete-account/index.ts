import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

/**
 * Deletes the calling user's account and all their data (right to erasure, UK GDPR).
 *
 * The caller proves who they are with their own JWT (sent automatically by
 * supabase.functions.invoke). We never trust a user id from the request body -
 * we resolve it from the verified token, so a user can only ever delete THEMSELVES.
 *
 * Removing the auth user cascades to `public.sessions` and `public.user_problems`
 * via their `on delete cascade` foreign keys, so no manual row cleanup is needed.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    return json({ error: 'Server is not configured for account deletion.' }, 500);
  }

  // service_role bypasses RLS and can call the admin API - it must stay server-side.
  const admin = createClient(url, serviceKey);

  // Identify the caller from their verified JWT, not from anything they send us.
  // Had to implement this so you can only delete your own data
  // instead of accepting a user id in the body and trusting it
  
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return json({ error: 'You must be signed in to delete your account.' }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    return json({ error: 'Your session is invalid. Please sign in again.' }, 401);
  }

  const { error: deleteErr } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deleteErr) {
    return json({ error: `Could not delete account: ${deleteErr.message}` }, 500);
  }

  return json({ deleted: true });
});
