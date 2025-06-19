import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AppError, ERROR_CODES, handleError, createErrorResponse, validateEnvVars } from "../utils.ts";

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
      throw new AppError(
        'Method not allowed',
        ERROR_CODES.INVALID_REQUEST,
        405
      );
    }

    // Validate required environment variables
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'Missing or invalid authorization header',
        ERROR_CODES.UNAUTHORIZED,
        401
      );
    }
    const jwt = authHeader.replace('Bearer ', '');

    // Verify JWT via Supabase
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error: verifyError } = await supabase.auth.getUser(jwt);
    if (verifyError || !data?.user) {
      throw new AppError(
        'Invalid authentication token',
        ERROR_CODES.UNAUTHORIZED,
        401,
        verifyError
      );
    }
    const userId = data.user.id;

    // Delete from Auth using the admin API
    const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${jwt}`, // Use the user's JWT
        'Content-Type': 'application/json',
      },
    });

    if (!adminRes.ok) {
      const err = await adminRes.text();
      console.error('Admin API Error:', err);
      throw new AppError(
        'Failed to delete user from auth system',
        ERROR_CODES.DATABASE_ERROR,
        500,
        err
      );
    }

    // Delete profile using RLS policies
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      throw new AppError(
        'Failed to delete user profile',
        ERROR_CODES.DATABASE_ERROR,
        500,
        profileError
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
});
