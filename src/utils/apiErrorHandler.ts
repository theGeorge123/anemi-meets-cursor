import type { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export const handleApiError = (error: unknown): ApiError => {
  if (typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError === true) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data: any = axiosError.response?.data;

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          message: data?.message || 'errors.validation.invalid_request',
          code: 'BAD_REQUEST',
          details: data,
        };
      case 401:
        return {
          message: 'errors.auth.unauthorized',
          code: 'UNAUTHORIZED',
          details: data,
        };
      case 403:
        return {
          message: 'errors.auth.forbidden',
          code: 'FORBIDDEN',
          details: data,
        };
      case 404:
        return {
          message: 'errors.api.not_found',
          code: 'NOT_FOUND',
          details: data,
        };
      case 409:
        return {
          message: 'errors.api.conflict',
          code: 'CONFLICT',
          details: data,
        };
      case 429:
        return {
          message: 'errors.api.rate_limited',
          code: 'RATE_LIMITED',
          details: data,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: 'errors.network.server',
          code: 'SERVER_ERROR',
          details: data,
        };
      default:
        return {
          message: 'errors.unknown',
          code: 'UNKNOWN_ERROR',
          details: data,
        };
    }
  }

  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes('Network Error')) {
      return {
        message: 'errors.network.offline',
        code: 'NETWORK_ERROR',
        details: error,
      };
    }
    if (error.message.includes('timeout')) {
      return {
        message: 'errors.network.timeout',
        code: 'TIMEOUT',
        details: error,
      };
    }
  }

  // Fallback for unknown errors
  return {
    message: 'errors.unknown',
    code: 'UNKNOWN_ERROR',
    details: error,
  };
};
