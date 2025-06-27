/*
 * Shared utilities for Supabase Edge Functions
 *
 * Usage:
 *   import { sendEmail, validateEnvVars, ... } from './utils.ts';
 *
 * Required environment variables for email:
 *   - RESEND_API_KEY: API key for Resend transactional email
 *
 * Use validateEnvVars(['RESEND_API_KEY', ...]) at the top of your handler to ensure all required env vars are present.
 */

// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from 'npm:resend@2.1.0';

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  status: number;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): ErrorResponse {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    // Handle known error types
    if (error.name === 'PostgrestError') {
      return {
        error: 'Database operation failed',
        code: 'DB_ERROR',
        status: 500,
        details: error.message,
      };
    }
    if (error.name === 'AuthApiError') {
      return {
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        status: 401,
        details: error.message,
      };
    }
    return {
      error: error.message,
      code: 'UNKNOWN_ERROR',
      status: 500,
    };
  }

  return {
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status: 500,
  };
}

export function createErrorResponse(errorResponse: ErrorResponse): Response {
  return new Response(JSON.stringify(errorResponse), {
    status: errorResponse.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, apikey, authorization',
    },
  });
}

export const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  THIRD_PARTY_ERROR: 'THIRD_PARTY_ERROR',
  MISSING_PARAMS: 'MISSING_PARAMS',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export function validateEnvVars(required: string[]): void {
  const missing = required.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    throw new AppError(
      `Missing required environment variables: ${missing.join(', ')}`,
      ERROR_CODES.SERVER_ERROR,
      500,
    );
  }
}

/**
 * Send an email using the Resend API or SDK.
 * Supports both direct HTTP and Resend SDK usage.
 * Throws AppError on failure.
 *
 * @param options - { to, subject, text, html, from, attachments }
 * @returns Promise<void>
 */
export async function sendEmail(options: {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Array<{ filename: string; content: string; type: string }>;
}) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    throw new AppError(
      'Missing RESEND_API_KEY environment variable',
      ERROR_CODES.SERVER_ERROR,
      500,
    );
  }
  const from = options.from || 'noreply@anemimeets.com';
  // Try Resend SDK if available
  try {
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
    return;
  } catch (e) {
    // Fallback to HTTP below
  }
  // Fallback: use HTTP API
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    }),
  });
  if (!res.ok) {
    throw new AppError('Failed to send email', ERROR_CODES.EMAIL_ERROR, 500, await res.text());
  }
}
