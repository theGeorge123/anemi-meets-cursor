export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    public details?: unknown
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
      details: error.details
    };
  }

  if (error instanceof Error) {
    // Handle known error types
    if (error.name === 'PostgrestError') {
      return {
        error: 'Database operation failed',
        code: 'DB_ERROR',
        status: 500,
        details: error.message
      };
    }
    if (error.name === 'AuthApiError') {
      return {
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        status: 401,
        details: error.message
      };
    }
    return {
      error: error.message,
      code: 'UNKNOWN_ERROR',
      status: 500
    };
  }

  return {
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status: 500
  };
}

export function createErrorResponse(errorResponse: ErrorResponse): Response {
  return new Response(
    JSON.stringify(errorResponse),
    {
      status: errorResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, apikey, authorization'
      }
    }
  );
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
  EMAIL_ERROR: 'EMAIL_ERROR'
} as const;

export function validateEnvVars(required: string[]): void {
  const missing = required.filter(key => !Deno.env.get(key));
  if (missing.length > 0) {
    throw new AppError(
      `Missing required environment variables: ${missing.join(', ')}`,
      ERROR_CODES.SERVER_ERROR,
      500
    );
  }
}

