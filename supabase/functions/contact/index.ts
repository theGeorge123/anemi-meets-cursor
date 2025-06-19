import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { AppError, ERROR_CODES, handleError, createErrorResponse } from "../utils.ts";

interface ContactBody { 
  name: string; 
  email: string; 
  message: string;
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

    let body: ContactBody;
    try {
      body = await req.json();
    } catch {
      throw new AppError(
        'Invalid JSON payload',
        ERROR_CODES.INVALID_REQUEST,
        400
      );
    }

    const { name, email, message } = body;
    if (!name || !email || !message) {
      throw new AppError(
        'Missing required fields: name, email, message',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // TODO: Add email validation
    if (!email.includes('@') || !email.includes('.')) {
      throw new AppError(
        'Invalid email format',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // TODO: Add message length validation
    if (message.length < 10) {
      throw new AppError(
        'Message must be at least 10 characters long',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contact form submitted successfully',
        data: {
          name,
          email,
          message,
          receivedAt: new Date().toISOString()
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
