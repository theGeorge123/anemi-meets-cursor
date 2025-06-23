import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../../src/types/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    // Environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

    // Create Supabase admin client
    const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Get request body
    const { cafeId, date, time } = await req.json();
    if (!cafeId || !date || !time) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Combine date and time into a single ISO string
    const adventureDate = new Date(`${date}T${time}`).toISOString();

    // 1. Save adventure to the database
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

    // 2. Get cafe details
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
      const errorBody = await resendResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorBody)}`);
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
