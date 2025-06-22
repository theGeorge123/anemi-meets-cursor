export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null;
          description: string;
          emoji: string;
          id: number;
          key: string;
          label: string;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          emoji: string;
          id?: number;
          key: string;
          label: string;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          emoji?: string;
          id?: number;
          key?: string;
          label?: string;
        };
        Relationships: [];
      };
      beta_signups: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          status?: string | null;
        };
        Relationships: [];
      };
      cafes: {
        Row: {
          address: string;
          city: string;
          city_id: string | null;
          created_at: string;
          description: string | null;
          gmaps_url: string | null;
          id: string;
          image_url: string | null;
          mission: string | null;
          name: string;
          open_afternoon: boolean | null;
          open_evening: boolean | null;
          open_morning: boolean | null;
          opening_hours: Json | null;
          price_bracket: string | null;
          rating: number | null;
          specialty: string | null;
          story: string | null;
          tags: string[] | null;
          transport: string[] | null;
          updated_at: string;
          verified: boolean | null;
        };
        Insert: {
          address: string;
          city: string;
          city_id?: string | null;
          created_at?: string;
          description?: string | null;
          gmaps_url?: string | null;
          id?: string;
          image_url?: string | null;
          mission?: string | null;
          name: string;
          open_afternoon?: boolean | null;
          open_evening?: boolean | null;
          open_morning?: boolean | null;
          opening_hours?: Json | null;
          price_bracket?: string | null;
          rating?: number | null;
          specialty?: string | null;
          story?: string | null;
          tags?: string[] | null;
          transport?: string[] | null;
          updated_at?: string;
          verified?: boolean | null;
        };
        Update: {
          address?: string;
          city?: string;
          city_id?: string | null;
          created_at?: string;
          description?: string | null;
          gmaps_url?: string | null;
          id?: string;
          image_url?: string | null;
          mission?: string | null;
          name?: string;
          open_afternoon?: boolean | null;
          open_evening?: boolean | null;
          open_morning?: boolean | null;
          opening_hours?: Json | null;
          price_bracket?: string | null;
          rating?: number | null;
          specialty?: string | null;
          story?: string | null;
          tags?: string[] | null;
          transport?: string[] | null;
          updated_at?: string;
          verified?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cafes_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
        ];
      };
      cities: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      communities: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      community_members: {
        Row: {
          community_id: string;
          id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          community_id: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          community_id?: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_members_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      event_participants: {
        Row: {
          event_id: string;
          id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          event_id: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          event_id?: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_participants_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          community_id: string | null;
          created_at: string;
          created_by: string;
          date: string;
          description: string | null;
          id: string;
          location: string | null;
          name: string;
        };
        Insert: {
          community_id?: string | null;
          created_at?: string;
          created_by: string;
          date: string;
          description?: string | null;
          id?: string;
          location?: string | null;
          name: string;
        };
        Update: {
          community_id?: string | null;
          created_at?: string;
          created_by?: string;
          date?: string;
          description?: string | null;
          id?: string;
          location?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      friend_invites: {
        Row: {
          accepted: boolean;
          accepted_at: string | null;
          created_at: string;
          id: string;
          invitee_email: string;
          inviter_id: string;
          token: string;
        };
        Insert: {
          accepted?: boolean;
          accepted_at?: string | null;
          created_at?: string;
          id?: string;
          invitee_email: string;
          inviter_id: string;
          token: string;
        };
        Update: {
          accepted?: boolean;
          accepted_at?: string | null;
          created_at?: string;
          id?: string;
          invitee_email?: string;
          inviter_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friend_invites_inviter_id_fkey';
            columns: ['inviter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      friend_requests: {
        Row: {
          addressee_id: string;
          created_at: string | null;
          id: string;
          requester_id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          addressee_id: string;
          created_at?: string | null;
          id?: string;
          requester_id: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          addressee_id?: string;
          created_at?: string | null;
          id?: string;
          requester_id?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      friendship_audit: {
        Row: {
          action: string;
          actor_id: string | null;
          id: string;
          occurring_at: string | null;
          target_user: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          id?: string;
          occurring_at?: string | null;
          target_user?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          id?: string;
          occurring_at?: string | null;
          target_user?: string | null;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          created_at: string;
          friend_id: string;
          id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          friend_id: string;
          id?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          friend_id?: string;
          id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_friend_id_fkey';
            columns: ['friend_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invitations: {
        Row: {
          cafe_id: string | null;
          city_id: string | null;
          created_at: string;
          creator_id: string | null;
          date_time_options: Json | null;
          email_b: string | null;
          expires_at: string | null;
          id: string;
          invitee_id: string | null;
          invitee_name: string | null;
          meeting_id: string | null;
          personal_note: string | null;
          selected_date: string;
          selected_time: string;
          status: string | null;
          token: string;
          updated_at: string | null;
        };
        Insert: {
          cafe_id?: string | null;
          city_id?: string | null;
          created_at?: string;
          creator_id?: string | null;
          date_time_options?: Json | null;
          email_b?: string | null;
          expires_at?: string | null;
          id?: string;
          invitee_id?: string | null;
          invitee_name?: string | null;
          meeting_id?: string | null;
          personal_note?: string | null;
          selected_date: string;
          selected_time: string;
          status?: string | null;
          token: string;
          updated_at?: string | null;
        };
        Update: {
          cafe_id?: string | null;
          city_id?: string | null;
          created_at?: string;
          creator_id?: string | null;
          date_time_options?: Json | null;
          email_b?: string | null;
          expires_at?: string | null;
          id?: string;
          invitee_id?: string | null;
          invitee_name?: string | null;
          meeting_id?: string | null;
          personal_note?: string | null;
          selected_date?: string;
          selected_time?: string;
          status?: string | null;
          token?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number | null;
          avatar_url: string | null;
          bio: string | null;
          cafe_preferences: Json | null;
          created_at: string;
          email: string | null;
          emoji: string | null;
          fullname: string | null;
          gender: string | null;
          id: string;
          isprivate: boolean | null;
          last_seen: string | null;
          lastseen: string | null;
          preferred_language: string | null;
          updated_at: string;
          wantsnotifications: boolean | null;
          wantsreminders: boolean | null;
          wantsupdates: boolean | null;
        };
        Insert: {
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          cafe_preferences?: Json | null;
          created_at?: string;
          email?: string | null;
          emoji?: string | null;
          fullname?: string | null;
          gender?: string | null;
          id: string;
          isprivate?: boolean | null;
          last_seen?: string | null;
          lastseen?: string | null;
          preferred_language?: string | null;
          updated_at?: string;
          wantsnotifications?: boolean | null;
          wantsreminders?: boolean | null;
          wantsupdates?: boolean | null;
        };
        Update: {
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          cafe_preferences?: Json | null;
          created_at?: string;
          email?: string | null;
          emoji?: string | null;
          fullname?: string | null;
          gender?: string | null;
          id?: string;
          isprivate?: boolean | null;
          last_seen?: string | null;
          lastseen?: string | null;
          preferred_language?: string | null;
          updated_at?: string;
          wantsnotifications?: boolean | null;
          wantsreminders?: boolean | null;
          wantsupdates?: boolean | null;
        };
        Relationships: [];
      };
      updates_subscribers: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          awarded_at: string | null;
          badge_key: string;
          id: number;
          user_id: string;
        };
        Insert: {
          awarded_at?: string | null;
          badge_key: string;
          id?: number;
          user_id: string;
        };
        Update: {
          awarded_at?: string | null;
          badge_key?: string;
          id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_badges_badge_key_fkey';
            columns: ['badge_key'];
            isOneToOne: false;
            referencedRelation: 'badge_analytics';
            referencedColumns: ['key'];
          },
          {
            foreignKeyName: 'user_badges_badge_key_fkey';
            columns: ['badge_key'];
            isOneToOne: false;
            referencedRelation: 'badges';
            referencedColumns: ['key'];
          },
        ];
      };
    };
    Views: {
      badge_analytics: {
        Row: {
          completion_percentage: number | null;
          key: string | null;
          label: string | null;
          total_awarded: number | null;
          unique_users: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_request_limit: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

export type Badge = Database['public']['Tables']['badges']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
