import { useState, useEffect, useCallback } from 'react';
import { Database } from '../types/supabase';
import {
  supabase,
  getRecord,
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  subscribeToChanges,
} from '../lib/supabase';
import { useError } from './useError';

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

interface UseSupabaseOptions<T extends TableName> {
  table: T;
  id?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  realtime?: boolean;
}

export function useSupabase<T extends TableName>(options: UseSupabaseOptions<T>) {
  const {
    table,
    id,
    filters,
    sortBy,
    sortOrder,
    page = 1,
    pageSize = 10,
    realtime = false,
  } = options;

  const [data, setData] = useState<TableRow<T> | TableRow<T>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState<number>(0);
  const { handleError } = useError();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (id) {
        const result = await getRecord(table, id);
        setData(result);
      } else {
        const result = await getRecords(table, {
          page,
          pageSize,
          filters,
          sortBy,
          sortOrder,
        });
        setData(result.data);
        setCount(result.count);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [table, id, filters, sortBy, sortOrder, page, pageSize, handleError]);

  const create = useCallback(
    async (newData: TableInsert<T>) => {
      try {
        setLoading(true);
        setError(null);
        const result = await createRecord(table, newData);
        setData(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        handleError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [table, handleError]
  );

  const update = useCallback(
    async (updateData: TableUpdate<T>) => {
      if (!id) throw new Error('ID is required for update operation');
      try {
        setLoading(true);
        setError(null);
        const result = await updateRecord(table, id, updateData);
        setData(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        handleError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [table, id, handleError]
  );

  const remove = useCallback(async () => {
    if (!id) throw new Error('ID is required for delete operation');
    try {
      setLoading(true);
      setError(null);
      await deleteRecord(table, id);
      setData(null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [table, id, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (realtime) {
      const subscription = subscribeToChanges(table, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData((prev) => {
            if (Array.isArray(prev)) {
              return [...prev, payload.new as TableRow<T>];
            }
            return payload.new as TableRow<T>;
          });
        } else if (payload.eventType === 'UPDATE') {
          setData((prev) => {
            if (Array.isArray(prev)) {
              return prev.map((item) =>
                item.id === payload.new?.id ? (payload.new as TableRow<T>) : item
              );
            }
            return payload.new as TableRow<T>;
          });
        } else if (payload.eventType === 'DELETE') {
          setData((prev) => {
            if (Array.isArray(prev)) {
              return prev.filter((item) => item.id !== payload.old?.id);
            }
            return null;
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [table, realtime]);

  return {
    data,
    loading,
    error,
    count,
    create,
    update,
    remove,
    refetch: fetchData,
  };
} 