// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import type { Database } from '../../../src/types/supabase.ts';
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
        'Access-Control-Allow-Headers': 'Content-Type, apikey, authorization',
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
    // @ts-expect-error Deno global is available in Edge Functions
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    // @ts-expect-error Deno global is available in Edge Functions
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { token, email } = await req.json();
    if (!token || !email) {
      throw new AppError('Missing invite token or email', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    // Require Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing authorization', ERROR_CODES.UNAUTHORIZED, 401);
    }
    const jwt = authHeader.replace('Bearer ', '');

    // Get authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !userData?.user) {
      throw new AppError('Invalid token', ERROR_CODES.UNAUTHORIZED, 401);
    }
    const user = userData.user;

    // Verify the email matches the authenticated user
    if (user.email !== email) {
      throw new AppError('Email mismatch', ERROR_CODES.UNAUTHORIZED, 403);
    }

    // Look up the invite
    const { data: invite, error: inviteError } = await supabase
      .from('friend_invites')
      .select('id, inviter_id, status, expires_at')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (inviteError || !invite) {
      throw new AppError('Invalid or expired invite token', ERROR_CODES.NOT_FOUND, 404);
    }

    // Call the atomic Postgres function via RPC
    const { data: result, error: rpcError } = await supabase.rpc('accept_friend_invite', {
      invite_id: invite.id,
      inviter_id: invite.inviter_id,
      invitee_id: user.id,
    });
    if (rpcError) {
      throw new AppError(
        'Failed to accept invite: ' + rpcError.message,
        ERROR_CODES.DATABASE_ERROR,
        500,
      );
    }

    if (!result.success) {
      throw new AppError(
        'Failed to accept invite: ' + (result.error || 'Unknown error'),
        ERROR_CODES.DATABASE_ERROR,
        400,
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, apikey, authorization',
      },
    });
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
}

// @ts-expect-error Deno global is available in Edge Functions
Deno.serve(handleAcceptFriendInvite);
