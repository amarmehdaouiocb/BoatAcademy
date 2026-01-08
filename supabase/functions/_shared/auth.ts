import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Get authenticated user from request
 * Throws if not authenticated
 */
export async function getAuthedUser(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('UNAUTHORIZED');
  }

  const supabase = createClient(url, anon, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('UNAUTHORIZED');
  }

  return { supabase, user: data.user };
}
