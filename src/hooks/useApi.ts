import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useError } from './useError';
import { handleApiError } from '../utils/apiErrorHandler';

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (config?: AxiosRequestConfig) => Promise<void>;
  reset: () => void;
}

export const useApi = <T>(url: string, config?: AxiosRequestConfig): UseApiReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleError } = useError();

  const execute = useCallback(
    async (requestConfig?: AxiosRequestConfig) => {
      try {
        setLoading(true);
        setError(null);

        const response: AxiosResponse<T> = await axios({
          url,
          ...config,
          ...requestConfig,
        });

        setData(response.data);
        return response.data;
      } catch (err) {
        const apiError = handleApiError(err);
        setError(new Error(apiError.message));
        handleError(apiError);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [url, config, handleError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}; 