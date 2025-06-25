import { useState } from 'react';
import { ErrorService } from '../services/error/ErrorService';

export function useAsyncOperation<T = unknown>(op: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await op();
      setData(res);
      return res;
    } catch (e) {
      setError(e);
      ErrorService.toast(ErrorService.handle(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };
  return { execute, data, error, loading };
}
