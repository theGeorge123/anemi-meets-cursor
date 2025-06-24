import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../src/types/supabase.ts';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
  sendEmail,
} from '../utils.ts';

export async function handleAcceptMeetingInvite(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, apikey, authorization, x-client-info',
      },
    });
  }

  if (req.method !== 'POST') {
    return createErrorResponse(
      handleError(new AppError('Only POST requests allowed.', ERROR_CODES.INVALID_REQUEST, 405)),
    );
  }

  try {
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { token, email } = await req.json();
    if (!token || !email) {
      throw new AppError('Missing invite token or email', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    // Look up the invite
    const { data: invite, error: inviteError } = await supabase
      .from('meeting_invites')
      .select('id, inviter_id, meeting_id, status')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();
    if (inviteError || !invite) {
      throw new AppError('Invalid or expired invite token', ERROR_CODES.NOT_FOUND, 404);
    }

    // Mark as accepted
    const { error: updateError } = await supabase
      .from('meeting_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString(), invitee_email: email })
      .eq('id', invite.id);
    if (updateError) {
      throw new AppError('Could not update invite', ERROR_CODES.DATABASE_ERROR, 500, updateError);
    }

    // Send confirmation emails to both inviter and the provided email
    // Look up inviter email
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('email, fullName')
      .eq('id', invite.inviter_id)
      .maybeSingle();
    const inviterEmail = inviterProfile?.email;
    const inviteeEmailToSend = email;
    // Compose email content (customize as needed)
    const subject = 'Meeting Accepted!';
    const html = `<p>Your meeting invite has been accepted. See you soon!</p>`;
    if (inviterEmail) {
      await sendEmail({ to: [inviterEmail], subject, html });
    }
    if (inviteeEmailToSend) {
      await sendEmail({ to: [inviteeEmailToSend], subject, html });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, apikey, authorization, x-client-info',
      },
    });
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
}

Deno.serve(handleAcceptMeetingInvite);
