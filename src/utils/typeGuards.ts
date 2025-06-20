import { Database } from '../types/supabase';

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

/**
 * Type guard for Profile
 */
export function isProfile(value: unknown): value is TableRow<'profiles'> {
  if (!value || typeof value !== 'object') return false;
  const profile = value as TableRow<'profiles'>;
  return (
    typeof profile.id === 'string' &&
    typeof profile.email === 'string' &&
    typeof profile.fullname === 'string' &&
    (profile.avatar_url === undefined || typeof profile.avatar_url === 'string') &&
    typeof profile.created_at === 'string' &&
    typeof profile.updated_at === 'string' &&
    (profile.preferred_language === undefined || typeof profile.preferred_language === 'string')
  );
}

/**
 * Type guard for Event
 */
export function isEvent(value: unknown): value is TableRow<'events'> {
  if (!value || typeof value !== 'object') return false;
  const event = value as TableRow<'events'>;
  return (
    typeof event.id === 'string' &&
    typeof event.name === 'string' &&
    (event.description === undefined ||
      event.description === null ||
      typeof event.description === 'string') &&
    typeof event.date === 'string' &&
    (event.location === undefined ||
      event.location === null ||
      typeof event.location === 'string') &&
    typeof event.created_by === 'string' &&
    typeof event.created_at === 'string' &&
    (event.community_id === undefined ||
      event.community_id === null ||
      typeof event.community_id === 'string')
  );
}

/**
 * Type guard for EventParticipant
 */
export function isEventParticipant(value: unknown): value is TableRow<'event_participants'> {
  if (!value || typeof value !== 'object') return false;
  const participant = value as TableRow<'event_participants'>;
  return (
    typeof participant.id === 'string' &&
    typeof participant.event_id === 'string' &&
    typeof participant.user_id === 'string' &&
    typeof participant.joined_at === 'string' &&
    typeof participant.role === 'string'
  );
}

/**
 * Type guard for Community
 */
export function isCommunity(value: unknown): value is TableRow<'communities'> {
  if (!value || typeof value !== 'object') return false;
  const community = value as TableRow<'communities'>;
  return (
    typeof community.id === 'string' &&
    typeof community.name === 'string' &&
    (community.description === undefined ||
      community.description === null ||
      typeof community.description === 'string') &&
    typeof community.created_by === 'string' &&
    typeof community.created_at === 'string'
  );
}

/**
 * Type guard for CommunityMember
 */
export function isCommunityMember(value: unknown): value is TableRow<'community_members'> {
  if (!value || typeof value !== 'object') return false;
  const member = value as TableRow<'community_members'>;
  return (
    typeof member.id === 'string' &&
    typeof member.community_id === 'string' &&
    typeof member.user_id === 'string' &&
    typeof member.role === 'string' &&
    typeof member.joined_at === 'string'
  );
}

/**
 * Type guard for array of a specific type
 */
export function isArrayOf<T extends TableName>(
  value: unknown,
  typeGuard: (value: unknown) => value is TableRow<T>,
): value is TableRow<T>[] {
  return Array.isArray(value) && value.every(typeGuard);
}

/**
 * Type guard for paginated response
 */
export function isPaginatedResponse<T extends TableName>(
  value: unknown,
  typeGuard: (value: unknown) => value is TableRow<T>,
): value is {
  data: TableRow<T>[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  if (!value || typeof value !== 'object') return false;
  const response = value as {
    data: unknown;
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  return (
    isArrayOf(response.data, typeGuard) &&
    typeof response.count === 'number' &&
    typeof response.page === 'number' &&
    typeof response.pageSize === 'number' &&
    typeof response.totalPages === 'number'
  );
}

/**
 * Type guard for filter options
 */
export function isFilterOptions(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Safely parse JSON with type checking
 */
export function safeParseJSON<T extends TableName>(
  json: string,
  typeGuard: (value: unknown) => value is TableRow<T>,
): TableRow<T> | null {
  try {
    const parsed = JSON.parse(json);
    return typeGuard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Validate and transform API response data
 */
export function validateResponse<T extends TableName>(
  value: unknown,
  typeGuard: (value: unknown) => value is TableRow<T>,
  fallback: TableRow<T> | null,
): TableRow<T> | null {
  return typeGuard(value) ? value : fallback;
}

type DateTimeOption = {
  date: string;
  times: string[];
};

export function isDateTimeOptions(value: unknown): value is DateTimeOption[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    return (
      typeof item === 'object' &&
      item !== null &&
      'date' in item &&
      typeof item.date === 'string' &&
      'times' in item &&
      Array.isArray(item.times) &&
      item.times.every((time: unknown) => typeof time === 'string')
    );
  });
}
