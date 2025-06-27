// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
} from '../utils.ts';
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export async function handleAcceptFriendInvite(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { token, email, selected_time, becomeFriends, password } = await req.json();
    if (!token || !email) {
      throw new AppError('Missing invite token or email', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    // Find the invite
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
      throw new AppError('Invalid or expired invite token', ERROR_CODES.NOT_FOUND, 404);
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from('friend_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);
    if (updateError) {
      throw new AppError('Could not update invite', ERROR_CODES.DATABASE_ERROR, 500, updateError);
    }

    if (becomeFriends) {
      // Check if user exists
      let userId: string | null = null;
      let userEmail = email;
      let userCreated = false;
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (existingUser && existingUser.id) {
        userId = existingUser.id;
      } else {
        // Create user (sign up)
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
          email,
          password: password || crypto.randomUUID(),
          email_confirm: true,
        });
        if (signUpError || !signUpData?.user?.id) {
          throw new AppError('Could not create user', ERROR_CODES.DATABASE_ERROR, 500, signUpError);
        }
        userId = signUpData.user.id;
        userCreated = true;
      }
      // Create friendship (both directions)
      const { error: friendshipError } = await supabase.from('friendships').upsert(
        [
          { user_id: invite.inviter_id, friend_id: userId, status: 'accepted' },
          { user_id: userId, friend_id: invite.inviter_id, status: 'accepted' },
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
      // Optionally: skip beta, send confirmation email, etc.
      // ...
      return new Response(JSON.stringify({ success: true, userCreated }), {
        status: 200,
        headers: corsHeaders,
      });
    } else {
      // Just accept, no friendship, no user creation
      // Optionally: send confirmation email, etc.
      return new Response(JSON.stringify({ success: true, noFriend: true }), {
        status: 200,
        headers: corsHeaders,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

serve(handleAcceptFriendInvite);
