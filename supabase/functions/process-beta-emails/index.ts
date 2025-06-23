import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import type { Database } from '../../src/types/supabase.ts';
import { Resend } from 'npm:resend@2.1.0';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
} from '../utils.ts';

Deno.serve(async (req) => {
  try {
    // Validate required environment variables
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']);

    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      throw new AppError('Only POST requests allowed', ERROR_CODES.INVALID_REQUEST, 405);
    }

    // Initialize Supabase client
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get unprocessed emails
    const { data: emails, error: fetchError } = await supabase
      .from('beta_email_queue')
      .select('*')
      .eq('processed', false)
      .limit(10);

    if (fetchError) {
      throw new AppError('Failed to fetch emails', ERROR_CODES.DATABASE_ERROR, 500, fetchError);
    }

    if (!emails || emails.length === 0) {
      return new Response(JSON.stringify({ message: 'No emails to process' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);
    const results = [];

    for (const record of emails) {
      const email = record.email;
      // Use Dutch if email ends with .nl, otherwise English
      const lang = email.endsWith('.nl') ? 'nl' : 'en';

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

      try {
        await resend.emails.send({
          from: 'Anemi Meets <noreply@anemimeets.com>',
          to: [email],
          subject,
          text: body,
        });

        // Mark as processed
        const { error: updateError } = await supabase
          .from('beta_email_queue')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', record.id);

        if (updateError) {
          results.push({ email, success: false, error: updateError.message });
        } else {
          results.push({ email, success: true });
        }
      } catch (error) {
        results.push({ email, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
});
