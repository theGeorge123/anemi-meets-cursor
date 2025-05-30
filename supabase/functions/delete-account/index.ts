import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

  // Decodeer JWT om user id te krijgen
  let userId = '';
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    userId = payload.sub;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No user id' }), { status: 400 });
  }

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