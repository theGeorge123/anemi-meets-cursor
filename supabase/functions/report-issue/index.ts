import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { AppError, ERROR_CODES, handleError, createErrorResponse } from "../utils.ts";

interface ReportBody {
  description: string;
  steps?: string;
  screenshot?: string | null;
  context?: unknown;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      throw new AppError(
        'Method not allowed',
        ERROR_CODES.INVALID_REQUEST,
        405
      );
    }

    let body: ReportBody;
    try {
      body = await req.json();
    } catch {
      throw new AppError(
        'Invalid JSON payload',
        ERROR_CODES.INVALID_REQUEST,
        400
      );
    }

    const { description, steps, screenshot, context } = body;
    if (!description) {
      throw new AppError(
        'Description is required',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Validate description length
    if (description.length < 10) {
      throw new AppError(
        'Description must be at least 10 characters long',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Validate screenshot if provided
    if (screenshot && typeof screenshot !== 'string') {
      throw new AppError(
        'Screenshot must be a base64 encoded string',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // For MVP: just echo back the received data
    // In production: store in DB, send email/Slack, etc.
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Issue report received successfully',
        data: {
          description,
          steps,
          hasScreenshot: !!screenshot,
          context,
          receivedAt: new Date().toISOString(),
        }
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
