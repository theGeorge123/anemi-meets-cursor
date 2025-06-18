import { serve } from 'std/server';
import { Resend } from 'resend';

serve(async (req) => {
  try {
    const { record } = await req.json();
    if (!record || record.status !== 'accepted') {
      return new Response('No action', { status: 200 });
    }
    const email = record.email;
    // Default to English, but use Dutch if email ends with .nl
    const lang = email.endsWith('.nl') ? 'nl' : 'en';
    const subject = lang === 'nl'
      ? 'Je bent erbij! Welkom bij de Anemi Meets Beta ☕️'
      : "You're in! Welcome to the Anemi Meets Beta ☕️";
    const body = lang === 'nl'
      ? 'Hey koffie-vriend! Je bent toegelaten tot de Anemi Meets beta. Log in en ga lekker koffiedrinken! ☕️✨'
      : "Hey coffee friend! You've been accepted to the Anemi Meets beta. Log in and start sipping! ☕️✨";
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    await resend.emails.send({
      from: 'Anemi Meets <noreply@anemimeets.com>',
      to: [email],
      subject,
      text: body,
    });
    return new Response('Email sent', { status: 200 });
  } catch (e) {
    return new Response('Error: ' + (e?.message || e), { status: 500 });
  }
}); 