import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
import type { Database } from '../../src/types/supabase.ts';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
} from '../utils.ts';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  try {
    // Validate required environment variables
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      throw new AppError('Only POST requests allowed', ERROR_CODES.INVALID_REQUEST, 405);
    }

    // Parse request body
    const { email } = await req.json().catch(() => {
      throw new AppError('Invalid JSON payload', ERROR_CODES.INVALID_REQUEST, 400);
    });

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new AppError('Valid email is required', ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Initialize Supabase client
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Insert new beta signup
    const { data, error } = await supabase
      .from('beta_signups')
      .insert([
        {
          email: email.toLowerCase().trim(),
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({
            message: 'Email already on beta list',
            error: 'DUPLICATE_EMAIL',
          }),
          {
            status: 409,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          },
        );
      }

      throw new AppError(
        'Failed to add email to beta list',
        ERROR_CODES.DATABASE_ERROR,
        500,
        error,
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Successfully added to beta list',
        data,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
});
