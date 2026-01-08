import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Create Supabase admin client with service role key
 * Use this for operations that bypass RLS
 */
export function supabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
