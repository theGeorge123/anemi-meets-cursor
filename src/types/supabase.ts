/**
 * Database schema types for Supabase
 * These types represent the structure of our database tables and their relationships
 */

/**
 * User profile information
 */
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  preferred_language: 'en' | 'nl';
  timezone: string;
}

/**
 * Event information
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  max_participants: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'cancelled';
  is_online: boolean;
  meeting_url?: string;
}

/**
 * Event participant information
 */
export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'registered' | 'attended' | 'cancelled';
  registered_at: string;
  attended_at?: string;
  cancelled_at?: string;
}

/**
 * Community information
 */
export interface Community {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_private: boolean;
  avatar_url?: string;
  banner_url?: string;
}

/**
 * Community member information
 */
export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  status: 'active' | 'inactive' | 'banned';
}

/**
 * Message information
 */
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at?: string;
}

/**
 * Notification information
 */
export interface Notification {
  id: string;
  user_id: string;
  type: 'event_invite' | 'message' | 'community_invite' | 'system';
  content: string;
  created_at: string;
  is_read: boolean;
  read_at?: string;
  related_id?: string;
}

/**
 * Friend invite information
 */
export interface FriendInvite {
  id: string;
  inviter_id: string;
  invitee_email: string;
  token: string;
  created_at: string;
  accepted: boolean;
  accepted_at?: string;
}

/**
 * Friendship information
 */
export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

/**
 * Database schema type
 * This type represents the entire database schema
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Event, 'id'>>;
      };
      event_participants: {
        Row: EventParticipant;
        Insert: Omit<EventParticipant, 'id' | 'registered_at'>;
        Update: Partial<Omit<EventParticipant, 'id'>>;
      };
      communities: {
        Row: Community;
        Insert: Omit<Community, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Community, 'id'>>;
      };
      community_members: {
        Row: CommunityMember;
        Insert: Omit<CommunityMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<CommunityMember, 'id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Message, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      event_status: 'draft' | 'published' | 'cancelled';
      participant_status: 'registered' | 'attended' | 'cancelled';
      member_role: 'member' | 'moderator' | 'admin';
      member_status: 'active' | 'inactive' | 'banned';
      notification_type: 'event_invite' | 'message' | 'community_invite' | 'system';
    };
  };
}

/**
 * Common response types for Supabase queries
 */
export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

export type SupabaseListResponse<T> = {
  data: T[] | null;
  error: Error | null;
  count: number | null;
};

/**
 * Type for paginated responses
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Type for filter options
 */
export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

/**
 * Type for event filters
 */
export interface EventFilters extends FilterOptions {
  status?: Event['status'];
  isOnline?: boolean;
  startDate?: string;
  endDate?: string;
}

/**
 * Type for community filters
 */
export interface CommunityFilters extends FilterOptions {
  is_private?: boolean;
  role?: CommunityMember['role'];
}

/**
 * Type for message filters
 */
export interface MessageFilters extends FilterOptions {
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}
