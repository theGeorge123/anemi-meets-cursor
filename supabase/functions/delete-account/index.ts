import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AppError, ERROR_CODES, handleError, createErrorResponse, validateEnvVars } from "../utils.ts";

// @ts-expect-error Deno globals are available in Edge Functions
Deno.serve(async (req: Request) => {
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

    // Delete from Auth
    const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!adminRes.ok) {
      const err = await adminRes.text();
      throw new AppError(
        'Failed to delete user from auth system',
        ERROR_CODES.DATABASE_ERROR,
        500,
        err
      );
    }

    // Delete profile
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
    });

    if (!dbRes.ok) {
      const err = await dbRes.text();
      throw new AppError(
        'Failed to delete user profile',
        ERROR_CODES.DATABASE_ERROR,
        500,
        err
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
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
});
