import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../src/types/supabase.ts';
import { validateEnvVars } from '../utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Authorization, authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Utility to escape HTML
function escapeHtml(str: string) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[tag] || tag,
  );
}

// Main function
async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    validateEnvVars([
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY',
    ]);
    // Environment variables
    const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY } =
      Deno.env.toObject();

    // user-scoped client for auth
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }
    const { cafeId, date, time } = body;
    if (!cafeId || !date || !time) {
      return new Response('Missing fields', { status: 400, headers: corsHeaders });
    }

    // Combine date and time into a single ISO string with explicit offset
    // TODO: Make offset dynamic based on user/cafe location if needed
    const adventureDate = `${date}T${time}:00+02:00`;

    // admin client just for the insert
    const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: newAdventure, error: insertError } = await supabaseAdmin
      .from('solo_adventures')
      .insert({
        user_id: user.id,
        cafe_id: cafeId,
        adventure_date: adventureDate,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 2. Get cafe details (no stray space in select)
    const { data: cafe, error: cafeError } = await supabaseAdmin
      .from('cafes')
      .select('name, address')
      .eq('id', cafeId)
      .single();

    if (cafeError) throw cafeError;

    // 3. Send confirmation email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Anemi <noreply@anemi.app>',
        to: [user.email],
        subject: `Je solo-avontuur bij ${escapeHtml(cafe.name)} is ingepland!`,
        html: `
          <h1>Hoi!</h1>
          <p>Je hebt zojuist een heerlijk solo-avontuur voor jezelf ingepland. Goed bezig!</p>
          <p><strong>Waar:</strong> ${escapeHtml(cafe.name)} (${escapeHtml(cafe.address)})</p>
          <p><strong>Wanneer:</strong> ${new Date(adventureDate).toLocaleString('nl-NL', { dateStyle: 'full', timeStyle: 'short' })}</p>
          <p>Geniet ervan!</p>
          <p>Liefs,<br>Het Anemi Team</p>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.json().catch(() => ({}));
      console.error('Failed to send email:', resendResponse.statusText, errorBody);
      return new Response(JSON.stringify({ error: 'Failed to send confirmation email' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(newAdventure), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Deno listener
Deno.serve(handler);
