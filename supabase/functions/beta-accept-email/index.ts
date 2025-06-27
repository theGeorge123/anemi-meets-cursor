import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
import { Resend } from 'npm:resend@2.1.0';
import type { Database } from '../../src/types/supabase.ts';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
  sendEmail,
} from '../utils.ts';

// 1. Definieer CORS-headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // of je eigen domein
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // 2. Beantwoord preflights vóór elke andere logica
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 3. Alleen POST toegestaan
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    validateEnvVars(['RESEND_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']);
    const { record } = await req.json().catch(() => {
      throw new AppError('Invalid JSON payload', ERROR_CODES.INVALID_REQUEST, 400);
    });
    if (!record || !record.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // If not accepted, return early but don't throw error
    if (record.status !== 'accepted') {
      return new Response(JSON.stringify({ message: 'No action needed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseAdmin = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_beta_user: true })
      .eq('email', record.email);
    if (profileError) {
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const email = record.email;
    let lang: 'nl' | 'en' = 'en';
    if (email.endsWith('.nl')) lang = 'nl';
    const subject =
      lang === 'nl'
        ? 'Je bent erbij! Welkom bij de Anemi Meets Beta ☕️'
        : "You're in! Welcome to the Anemi Meets Beta ☕️";
    const body =
      lang === 'nl'
        ? `Hoi koffieliefhebber!

Je bent toegelaten tot de Anemi Meets beta. Je kunt nu inloggen en alle functies uitproberen. Plan een meetup, nodig vrienden uit en laat ons weten wat je ervan vindt!

Veel plezier en geniet van de koffie ☕️✨

Groetjes,
Het Anemi Meets team`
        : `Hey coffee friend!

You've been accepted to the Anemi Meets beta. You can now log in and try all the features. Plan a meetup, invite friends, and let us know what you think!

Have fun and enjoy your coffee ☕️✨

Cheers,
The Anemi Meets team`;
    const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);
    try {
      await resend.emails.send({
        from: 'Anemi Meets <noreply@anemimeets.com>',
        to: [email],
        subject,
        text: body,
      });
    } catch (emailError) {
      return new Response(JSON.stringify({ error: 'Failed to send welcome email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, message: 'Welcome email sent' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
