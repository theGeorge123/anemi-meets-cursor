import { serve } from 'std/server';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
  sendEmail,
} from '../utils.ts';

serve(async (req) => {
  try {
    // Validate required environment variables
    validateEnvVars(['RESEND_API_KEY']);

    if (req.method !== 'POST') {
      throw new AppError('Only POST requests allowed', ERROR_CODES.INVALID_REQUEST, 405);
    }

    const { record } = await req.json().catch(() => {
      throw new AppError('Invalid JSON payload', ERROR_CODES.INVALID_REQUEST, 400);
    });

    if (!record || !record.email) {
      throw new AppError('Missing required fields: email', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    // If not accepted, return early but don't throw error
    if (record.status !== 'accepted') {
      return new Response(JSON.stringify({ message: 'No action needed' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const email = record.email;
    // Use Dutch if email ends with .nl, otherwise English
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
      throw new AppError('Failed to send welcome email', ERROR_CODES.EMAIL_ERROR, 500, emailError);
    }

    return new Response(JSON.stringify({ success: true, message: 'Welcome email sent' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
});
