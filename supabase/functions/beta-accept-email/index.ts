import { serve } from 'std/server';
import { Resend } from 'resend';

serve(async (req) => {
  try {
    const { record } = await req.json();
    if (!record || record.status !== 'accepted') {
      return new Response('No action', { status: 200 });
    }
    const email = record.email;
    // Use Dutch if email ends with .nl, otherwise English
    let lang: 'nl' | 'en' = 'en';
    if (email.endsWith('.nl')) lang = 'nl';
    const subject = lang === 'nl'
      ? 'Je bent erbij! Welkom bij de Anemi Meets Beta ☕️'
      : "You're in! Welcome to the Anemi Meets Beta ☕️";
    const body = lang === 'nl'
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