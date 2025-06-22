// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
} from '../utils.ts';

export async function handleAcceptFriendInvite(req: Request): Promise<Response> {
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

  try {
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { token, email } = await req.json();
    if (!token || !email) {
      throw new AppError('Missing invite token or email', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing authorization', ERROR_CODES.UNAUTHORIZED, 401);
    }
    const jwt = authHeader.replace('Bearer ', '');

    const { data: userData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !userData?.user) {
      throw new AppError('Invalid token', ERROR_CODES.UNAUTHORIZED, 401);
    }
    const user = userData.user;

    if (user.email !== email) {
      throw new AppError('Email mismatch', ERROR_CODES.UNAUTHORIZED, 403);
    }

    const { data: invite, error: inviteError } = await supabase
      .from('friend_invites')
      .select('id, inviter_id, invitee_email, status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (
      inviteError ||
      !invite ||
      invite.invitee_email !== email ||
      invite.status !== 'pending' ||
      (invite.expires_at && new Date(invite.expires_at) < new Date())
    ) {
      throw new AppError(
        'Invalid or expired invite token',
        ERROR_CODES.NOT_FOUND,
        404,
      );
    }

    const { error: updateError } = await supabase
      .from('friend_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (updateError) {
      throw new AppError(
        'Could not update invite',
        ERROR_CODES.DATABASE_ERROR,
        500,
        updateError,
      );
    }

    const { error: friendshipError } = await supabase
      .from('friendships')
      .upsert(
        [
          { user_id: invite.inviter_id, friend_id: user.id, status: 'accepted' },
          { user_id: user.id, friend_id: invite.inviter_id, status: 'accepted' },
        ],
        { onConflict: 'user_id,friend_id' },
      );

    if (friendshipError) {
      throw new AppError(
        'Could not create friendship',
        ERROR_CODES.DATABASE_ERROR,
        500,
        friendshipError,
      );
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

Deno.serve(handleAcceptFriendInvite);
