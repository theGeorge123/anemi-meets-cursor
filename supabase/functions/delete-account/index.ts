import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log, logError, retry } from "../_utils/logger.ts";

// @ts-expect-error Deno globals are available in Edge Functions
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing server config');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
    }
    const jwt = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error: verifyError } = await retry(() => supabase.auth.getUser(jwt));
    if (verifyError || !data?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    const userId = data.user.id;

    const adminRes = await retry(() =>
      fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      })
    );
    if (!adminRes.ok) {
      const err = await adminRes.text();
      throw new Error('Failed to delete user: ' + err);
    }

    const dbRes = await retry(() =>
      fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
      })
    );
    if (!dbRes.ok) {
      const err = await dbRes.text();
      throw new Error('Failed to delete profile: ' + err);
    }

    log('Deleted account', { userId });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    logError(e);
    return new Response(JSON.stringify({ error: e.message ?? 'Unexpected error' }), { status: 500 });
  }
});
