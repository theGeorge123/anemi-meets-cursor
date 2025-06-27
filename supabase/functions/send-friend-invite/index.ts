import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../src/types/supabase.ts';
import {
  escapeHtml,
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
} from '../utils.ts';
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

function getUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Secure fallback using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Per RFC4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return [...bytes]
      .map((b, i) => ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0'))
      .join('');
  }
  throw new AppError(
    'No secure random generator available for UUID',
    ERROR_CODES.SERVER_ERROR,
    500,
  );
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Validate required environment variables
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

    // Create Supabase admin client with service role key
    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get request data first
    const { invitee_email, lang = 'en' } = await req.json();
    if (!invitee_email) {
      throw new AppError('Missing invitee_email', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    // Generate a unique token (UUID, no dashes)
    let token = getUUID().replace(/-/g, '');
    // Ensure the token is unique
    let { data: existingInvite } = await supabase
      .from('friend_invites')
      .select('id')
      .eq('token', token)
      .maybeSingle();
    while (existingInvite) {
      token = getUUID().replace(/-/g, '');
      ({ data: existingInvite } = await supabase
        .from('friend_invites')
        .select('id')
        .eq('token', token)
        .maybeSingle());
    }

    // Insert the friend_invites row with status and expires_at
    const insertData: Record<string, unknown> = {
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitee_email,
    };

    // Try to get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const jwt = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabase.auth.getUser(jwt);
      if (!authError && userData?.user) {
        insertData.inviter_id = userData.user.id;
      }
    }

    // Insert the invite
    const { error: insertError } = await supabase.from('friend_invites').insert(insertData);
    if (insertError) {
      throw new AppError('Could not create invite', ERROR_CODES.DATABASE_ERROR, 500, insertError);
    }

    // Look up inviter profile if we have an inviter_id
    let inviterName = 'A friend';
    if (insertData.inviter_id) {
      const { data: inviter } = await supabase
        .from('profiles')
        .select('fullName')
        .eq('id', insertData.inviter_id)
        .maybeSingle();
      if (inviter?.fullName) {
        inviterName = inviter.fullName;
      }
    }

    const isEnglish = lang === 'en';
    // @ts-expect-error Deno globals are available in Edge Functions
    const inviteLink = `${Deno.env.get('PUBLIC_SITE_URL') || 'https://anemimeets.com'}/invite-friend/${token}`;
    const siteUrl = inviteLink.split('/invite-friend/')[0];
    const safeName = escapeHtml(inviterName);
    const subject = isEnglish
      ? `${safeName} invited you for coffee on Anemi Meets! ☕️`
      : `${safeName} heeft je uitgenodigd op Anemi Meets! ☕️`;
    const safeInviteLink = escapeHtml(inviteLink);
    const safeSiteUrl = escapeHtml(siteUrl);
    const html = isEnglish
      ? `
        <h2>☕️ ${safeName} wants to connect with you on Anemi Meets!</h2>
        <p>Hi there!<br><br>
        <b>${safeName}</b> thinks you're awesome and wants to be friends on <b>Anemi Meets</b>.<br>
        <br>
        <a href="${safeInviteLink}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Accept Invite & Become Friends</a>
        <br><br>
        <b>Why did you get this invite?</b><br>
        Someone you know wants to connect, plan meetups, and share good times!<br><br>
        <b>What is Anemi Meets?</b><br>
        Anemi Meets is the easiest way to plan real-life coffee meetups with friends. No endless group chats, just pick a time and meet up! 100% free, privacy-friendly, and made for real connections.<br><br>
        Curious? <a href="${safeSiteUrl}">${safeSiteUrl}</a>
        <br><br>
        See you soon! ☕️✨
        </p>
      `
      : `
        <h2>☕️ ${safeName} wil met je verbinden op Anemi Meets!</h2>
        <p>Hoi!<br><br>
        <b>${safeName}</b> vindt jou gezellig en wil vrienden worden op <b>Anemi Meets</b>.<br>
        <br>
        <a href="${safeInviteLink}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Accepteer Uitnodiging & Word Vrienden</a>
        <br><br>
        <b>Waarom krijg je deze uitnodiging?</b><br>
        Iemand die je kent wil met je verbinden, samen afspreken en leuke momenten delen!<br><br>
        <b>Wat is Anemi Meets?</b><br>
        Anemi Meets is de makkelijkste manier om echte koffiedates te plannen met vrienden. Geen eindeloze groepsapps, gewoon een tijd kiezen en afspreken! 100% gratis, privacyvriendelijk en gemaakt voor échte connecties.<br><br>
        Nieuwsgierig? <a href="${safeSiteUrl}">${safeSiteUrl}</a>
        <br><br>
        Tot snel! ☕️✨
        </p>
      `;

    if (invitee_email) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@anemimeets.com',
          to: [invitee_email],
          subject,
          html,
        }),
      });

      if (!emailRes.ok) {
        throw new AppError(
          'Failed to send email',
          ERROR_CODES.EMAIL_ERROR,
          500,
          await emailRes.text(),
        );
      }
    }

    return new Response(JSON.stringify({ success: true, token }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
