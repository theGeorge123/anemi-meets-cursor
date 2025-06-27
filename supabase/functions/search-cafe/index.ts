// @deno-types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../src/types/supabase.ts';
import {
  AppError,
  ERROR_CODES,
  handleError,
  createErrorResponse,
  validateEnvVars,
} from '../utils.ts';
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

type CafeSearchPayload = {
  city: string;
  timePreference?: 'morning' | 'afternoon' | 'evening';
  tags?: string[];
  price_bracket?: 'low' | 'mid' | 'high';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export async function handleSearchCafe(req: Request): Promise<Response> {
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
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

    const { city, timePreference, tags, price_bracket }: CafeSearchPayload = await req.json();

    if (!city) {
      throw new AppError('City is required', ERROR_CODES.MISSING_PARAMS);
    }

    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let query = supabase.from('cafes').select('*').eq('city', city);

    if (timePreference) {
      query = query.eq(`open_${timePreference}`, true);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (price_bracket) {
      query = query.eq('price_bracket', price_bracket);
    }

    const { data: cafes, error } = await query;

    if (error) {
      throw new AppError('Error fetching cafes', ERROR_CODES.DATABASE_ERROR, error);
    }

    return new Response(JSON.stringify({ cafes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
}

// @ts-expect-error Deno global is available in Edge Functions
serve(handleSearchCafe);
