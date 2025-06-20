import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../../src/types/supabase.ts'
import { AppError, ERROR_CODES, handleError, createErrorResponse, validateEnvVars } from '../utils.ts'

serve(async (req) => {
  try {
    // Validate required environment variables
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

    if (req.method !== 'POST') {
      throw new AppError(
        'Only POST requests allowed',
        ERROR_CODES.INVALID_REQUEST,
        405
      );
    }

    const { userId, action, metadata } = await req.json().catch(() => {
      throw new AppError(
        'Invalid JSON payload',
        ERROR_CODES.INVALID_REQUEST,
        400
      );
    });

    if (!userId || !action) {
      throw new AppError(
        'Missing required fields: userId, action',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Complex badge logic
    switch (action) {
      case 'check_meetup_badges': {
        const { data: meetups, error } = await supabase
          .from('invitations')
          .select('id')
          .or(`invitee_id.eq.${userId},requester_id.eq.${userId}`)
          .eq('status', 'accepted');

        if (error) {
          throw new AppError(
            'Failed to fetch meetups',
            ERROR_CODES.DATABASE_ERROR,
            500,
            error
          );
        }

        const meetupCount = meetups?.length || 0;
        
        if (meetupCount === 1) {
          const { error: badgeError } = await supabase
            .from('user_badges')
            .insert({ user_id: userId, badge_key: 'first_meetup' })
            .select();

          if (badgeError) {
            throw new AppError(
              'Failed to award first meetup badge',
              ERROR_CODES.DATABASE_ERROR,
              500,
              badgeError
            );
          }
        } else if (meetupCount === 5) {
          const { error: badgeError } = await supabase
            .from('user_badges')
            .insert({ user_id: userId, badge_key: 'five_meetups' })
            .select();

          if (badgeError) {
            throw new AppError(
              'Failed to award five meetups badge',
              ERROR_CODES.DATABASE_ERROR,
              500,
              badgeError
            );
          }
        }
        break;
      }
      case 'check_activity_badges':
        // Add custom logic for activity badges
        break;
      default:
        throw new AppError(
          `Unknown action: ${action}`,
          ERROR_CODES.INVALID_REQUEST,
          400
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Badge check completed successfully'
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