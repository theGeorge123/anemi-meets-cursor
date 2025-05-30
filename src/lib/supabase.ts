import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import {
  isProfile,
  isEvent,
  isEventParticipant,
  isCommunity,
  isCommunityMember,
  isMessage,
  isNotification,
  validateResponse,
} from '../utils/typeGuards';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Helper function to handle Supabase errors
 */
export const handleSupabaseError = (error: unknown) => {
  console.error('Supabase error:', error);
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('An error occurred while interacting with the database');
};

/**
 * Type guard mapping for database tables
 */
const typeGuards = {
  profiles: isProfile,
  events: isEvent,
  event_participants: isEventParticipant,
  communities: isCommunity,
  community_members: isCommunityMember,
  messages: isMessage,
  notifications: isNotification,
} as const;

type TableName = keyof typeof typeGuards;

/**
 * Helper function to get a single record with type validation
 */
export async function getRecord<T extends TableName>(
  table: T,
  id: string
): Promise<Database['public']['Tables'][T]['Row'] | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) handleSupabaseError(error);
  
  const typeGuard = typeGuards[table];
  if (!typeGuard) {
    throw new Error(`No type guard found for table: ${table}`);
  }

  return validateResponse(data, typeGuard, null);
}

/**
 * Helper function to get multiple records with pagination and type validation
 */
export async function getRecords<T extends TableName>(
  table: T,
  options: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, any>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{
  data: Database['public']['Tables'][T]['Row'][];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { page = 1, pageSize = 10, filters = {}, sortBy, sortOrder } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(table)
    .select('*', { count: 'exact' });

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      query = query.eq(key, value);
    }
  });

  // Apply sorting
  if (sortBy) {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) handleSupabaseError(error);

  const typeGuard = typeGuards[table];
  if (!typeGuard) {
    throw new Error(`No type guard found for table: ${table}`);
  }

  // Validate each item in the array
  const validatedData = Array.isArray(data) ? data.filter(typeGuard) : [];

  return {
    data: validatedData,
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Helper function to create a record with type validation
 */
export async function createRecord<T extends TableName>(
  table: T,
  data: Database['public']['Tables'][T]['Insert']
): Promise<Database['public']['Tables'][T]['Row']> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) handleSupabaseError(error);

  const typeGuard = typeGuards[table];
  if (!typeGuard) {
    throw new Error(`No type guard found for table: ${table}`);
  }

  const validatedResult = validateResponse(result, typeGuard, null);
  if (!validatedResult) {
    throw new Error(`Failed to validate created record for table: ${table}`);
  }

  return validatedResult;
}

/**
 * Helper function to update a record with type validation
 */
export async function updateRecord<T extends TableName>(
  table: T,
  id: string,
  data: Database['public']['Tables'][T]['Update']
): Promise<Database['public']['Tables'][T]['Row']> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);

  const typeGuard = typeGuards[table];
  if (!typeGuard) {
    throw new Error(`No type guard found for table: ${table}`);
  }

  const validatedResult = validateResponse(result, typeGuard, null);
  if (!validatedResult) {
    throw new Error(`Failed to validate updated record for table: ${table}`);
  }

  return validatedResult;
}

/**
 * Helper function to delete a record
 */
export async function deleteRecord<T extends TableName>(
  table: T,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

/**
 * Helper function to perform a realtime subscription with type validation
 */
export function subscribeToChanges<T extends TableName>(
  table: T,
  callback: (payload: {
    new: Database['public']['Tables'][T]['Row'] | null;
    old: Database['public']['Tables'][T]['Row'] | null;
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  }) => void
) {
  const typeGuard = typeGuards[table];
  if (!typeGuard) {
    throw new Error(`No type guard found for table: ${table}`);
  }

  return supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      (payload) => {
        const validatedPayload = {
          new: payload.new ? validateResponse(payload.new, typeGuard, null) : null,
          old: payload.old ? validateResponse(payload.old, typeGuard, null) : null,
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        };
        callback(validatedPayload);
      }
    )
    .subscribe();
} 