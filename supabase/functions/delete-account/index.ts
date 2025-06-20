import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../../src/types/supabase.ts';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
} from '../utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// @ts-expect-error Deno globals are available in Edge Functions
Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', ERROR_CODES.INVALID_REQUEST, 405);
    }

    // Validate required environment variables
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', ERROR_CODES.UNAUTHORIZED, 401);
    }
    const jwt = authHeader.replace('Bearer ', '');

    // Create admin client with service role
    const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify JWT and get user
    const {
      data: { user },
      error: verifyError,
    } = await adminClient.auth.getUser(jwt);
    if (verifyError || !user) {
      throw new AppError(
        'Invalid authentication token',
        ERROR_CODES.UNAUTHORIZED,
        401,
        verifyError,
      );
    }

    // --- Send Farewell Email ---
    try {
      // 1. Get user profile for language preference
      const { data: profile } = await adminClient
        .from('profiles')
        .select('preferred_language, fullName')
        .eq('id', user.id)
        .single();

      const lang = profile?.preferred_language || 'en';
      const userName = profile?.fullName?.split(' ')[0] || 'friend';
      const isEnglish = lang === 'en';

      const subject = isEnglish
        ? "We'll miss you at Anemi Meets! 😢"
        : 'We gaan je missen bij Anemi Meets! 😢';

      const html = isEnglish
        ? `
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="font-size: 24px; color: #333;">So long, farewell!</h1>
            <p style="font-size: 18px; color: #555; margin-top: 20px;">
              Hey ${userName},<br/><br/>
              Your Anemi Meets account has been deleted. We're sad to see you go, but we get it. No hard feelings!
            </p>
            <p style="font-size: 16px; color: #777; margin-top: 30px;">
              If you ever get that craving for a spontaneous coffee meetup again, you know where to find us. Our door is always open.
            </p>
            <div style="margin-top: 40px;">
              <a href="https://anemimeets.com" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
                Visit Anemi Meets
              </a>
            </div>
            <p style="font-size: 14px; color: #999; margin-top: 40px;">
              Wishing you all the best,<br/>
              The Anemi Meets Team
            </p>
          </div>
        `
        : `
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="font-size: 24px; color: #333;">Tot ziens, vaarwel!</h1>
            <p style="font-size: 18px; color: #555; margin-top: 20px;">
              Hoi ${userName},<br/><br/>
              Je Anemi Meets-account is verwijderd. We vinden het jammer je te zien gaan, maar we snappen het. Geen harde gevoelens!
            </p>
            <p style="font-size: 16px; color: #777; margin-top: 30px;">
              Als je ooit weer zin krijgt in een spontane koffie-afspraak, weet je ons te vinden. Onze deur staat altijd open.
            </p>
            <div style="margin-top: 40px;">
              <a href="https://anemimeets.com" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
                Bezoek Anemi Meets
              </a>
            </div>
            <p style="font-size: 14px; color: #999; margin-top: 40px;">
              We wensen je het allerbeste,<br/>
              Het Anemi Meets Team
            </p>
          </div>
        `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@anemimeets.com',
          to: [user.email],
          subject,
          html,
        }),
      });
    } catch (emailError) {
      // Log the error but don't block account deletion
      console.error(
        'Failed to send farewell email, but proceeding with account deletion.',
        emailError,
      );
    }
    // --- End of Farewell Email ---

    // Delete the user using admin API
    const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!adminRes.ok) {
      const err = await adminRes.text();
      console.error('Admin API Error:', err);
      throw new AppError(
        'Failed to delete user from auth system',
        ERROR_CODES.DATABASE_ERROR,
        500,
        err,
      );
    }

    // Delete profile using admin client
    const { error: profileError } = await adminClient.from('profiles').delete().eq('id', user.id);

    if (profileError) {
      throw new AppError(
        'Failed to delete user profile',
        ERROR_CODES.DATABASE_ERROR,
        500,
        profileError,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return createErrorResponse(handleError(error));
  }
});
