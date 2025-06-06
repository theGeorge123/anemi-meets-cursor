import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-expect-error Deno globals are available in Edge Functions
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing server config' }), { status: 500 });
  }

  // Haal JWT uit Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
  }
  const jwt = authHeader.replace('Bearer ', '');

  // Verify JWT via Supabase
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error: verifyError } = await supabase.auth.getUser(jwt);
  if (verifyError || !data?.user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }
  const userId = data.user.id;

  // Verwijder uit Auth
  const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!adminRes.ok) {
    const err = await adminRes.text();
    return new Response(JSON.stringify({ error: 'Failed to delete user', details: err }), { status: 500 });
  }

  // Verwijder profiel
  const dbRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  });
  if (!dbRes.ok) {
    const err = await dbRes.text();
    return new Response(JSON.stringify({ error: 'Failed to delete profile', details: err }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
