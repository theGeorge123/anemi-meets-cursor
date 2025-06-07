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
    typeof profile.fullName === 'string' &&
    (profile.avatar_url === undefined || typeof profile.avatar_url === 'string') &&
    typeof profile.created_at === 'string' &&
    typeof profile.updated_at === 'string' &&
    (profile.preferred_language === 'en' || profile.preferred_language === 'nl') &&
    typeof profile.timezone === 'string'
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
    typeof event.title === 'string' &&
    typeof event.description === 'string' &&
    typeof event.start_time === 'string' &&
    typeof event.end_time === 'string' &&
    typeof event.location === 'string' &&
    typeof event.max_participants === 'number' &&
    typeof event.created_by === 'string' &&
    typeof event.created_at === 'string' &&
    typeof event.updated_at === 'string' &&
    ['draft', 'published', 'cancelled'].includes(event.status) &&
    typeof event.is_online === 'boolean' &&
    (event.meeting_url === undefined || typeof event.meeting_url === 'string')
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
    ['registered', 'attended', 'cancelled'].includes(participant.status) &&
    typeof participant.registered_at === 'string' &&
    (participant.attended_at === undefined || typeof participant.attended_at === 'string') &&
    (participant.cancelled_at === undefined || typeof participant.cancelled_at === 'string')
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
    typeof community.description === 'string' &&
    typeof community.created_by === 'string' &&
    typeof community.created_at === 'string' &&
    typeof community.updated_at === 'string' &&
    typeof community.isPrivate === 'boolean' &&
    (community.avatar_url === undefined || typeof community.avatar_url === 'string') &&
    (community.banner_url === undefined || typeof community.banner_url === 'string')
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
    ['member', 'moderator', 'admin'].includes(member.role) &&
    typeof member.joined_at === 'string' &&
    ['active', 'inactive', 'banned'].includes(member.status)
  );
}

/**
 * Type guard for Message
 */
export function isMessage(value: unknown): value is TableRow<'messages'> {
  if (!value || typeof value !== 'object') return false;
  const message = value as TableRow<'messages'>;
  return (
    typeof message.id === 'string' &&
    typeof message.sender_id === 'string' &&
    typeof message.receiver_id === 'string' &&
    typeof message.content === 'string' &&
    typeof message.created_at === 'string' &&
    typeof message.updated_at === 'string' &&
    typeof message.is_read === 'boolean' &&
    (message.read_at === undefined || typeof message.read_at === 'string')
  );
}

/**
 * Type guard for Notification
 */
export function isNotification(value: unknown): value is TableRow<'notifications'> {
  if (!value || typeof value !== 'object') return false;
  const notification = value as TableRow<'notifications'>;
  return (
    typeof notification.id === 'string' &&
    typeof notification.user_id === 'string' &&
    ['event_invite', 'message', 'community_invite', 'system'].includes(notification.type) &&
    typeof notification.content === 'string' &&
    typeof notification.created_at === 'string' &&
    typeof notification.is_read === 'boolean' &&
    (notification.read_at === undefined || typeof notification.read_at === 'string') &&
    (notification.related_id === undefined || typeof notification.related_id === 'string')
  );
}

/**
 * Type guard for array of a specific type
 */
export function isArrayOf<T extends TableName>(
  value: unknown,
  typeGuard: (value: unknown) => value is TableRow<T>
): value is TableRow<T>[] {
  return Array.isArray(value) && value.every(typeGuard);
}

/**
 * Type guard for paginated response
 */
export function isPaginatedResponse<T extends TableName>(
  value: unknown,
  typeGuard: (value: unknown) => value is TableRow<T>
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
  typeGuard: (value: unknown) => value is TableRow<T>
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
  fallback: TableRow<T> | null
): TableRow<T> | null {
  return typeGuard(value) ? value : fallback;
}
