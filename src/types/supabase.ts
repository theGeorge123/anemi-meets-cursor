export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string;
          description: string | null;
          icon_name: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon_name?: string | null;
          id: string;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon_name?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      beta_signups: {
        Row: {
          created_at: string;
          email: string;
          id: number;
          status: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: number;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: number;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      cafe_analytics: {
        Row: {
          cafe_id: number;
          created_at: string;
          event_type: string;
          id: number;
          profile_id: string | null;
        };
        Insert: {
          cafe_id: number;
          created_at?: string;
          event_type: string;
          id?: number;
          profile_id?: string | null;
        };
        Update: {
          cafe_id?: number;
          created_at?: string;
          event_type?: string;
          id?: number;
          profile_id?: string | null;
        };
        Relationships: [];
      };
      cafe_reviews: {
        Row: {
          cafe_id: number;
          comment: string | null;
          created_at: string;
          id: number;
          profile_id: string;
          rating: number;
        };
        Insert: {
          cafe_id: number;
          comment?: string | null;
          created_at?: string;
          id?: number;
          profile_id: string;
          rating: number;
        };
        Update: {
          cafe_id?: number;
          comment?: string | null;
          created_at?: string;
          id?: number;
          profile_id?: string;
          rating?: number;
        };
        Relationships: [];
      };
      cafes: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          gmaps_url: string | null;
          id: number;
          mission: string | null;
          name: string;
          specialty: string | null;
          story: string | null;
          tags: string[] | null;
          verified: boolean | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          gmaps_url?: string | null;
          id?: number;
          mission?: string | null;
          name: string;
          specialty?: string | null;
          story?: string | null;
          tags?: string[] | null;
          verified?: boolean | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          gmaps_url?: string | null;
          id?: number;
          mission?: string | null;
          name?: string;
          specialty?: string | null;
          story?: string | null;
          tags?: string[] | null;
          verified?: boolean | null;
        };
        Relationships: [];
      };
      friend_requests: {
        Row: {
          created_at: string;
          id: string;
          receiver_id: string;
          sender_id: string;
          status: Database['public']['Enums']['friend_request_status'];
          token: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          receiver_id: string;
          sender_id: string;
          status?: Database['public']['Enums']['friend_request_status'];
          token?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          receiver_id?: string;
          sender_id?: string;
          status?: Database['public']['Enums']['friend_request_status'];
          token?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friend_requests_receiver_id_fkey';
            columns: ['receiver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friend_requests_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      friendships: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          user1_id: string;
          user2_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user1_id: string;
          user2_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user1_id?: string;
          user2_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_user1_id_fkey';
            columns: ['user1_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_user2_id_fkey';
            columns: ['user2_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invitations: {
        Row: {
          cafe_id: number | null;
          created_at: string;
          id: string;
          invitee_id: string | null;
          inviter_id: string;
          meetup_date: string;
          status: Database['public']['Enums']['invitation_status'];
          token: string | null;
          updated_at: string;
        };
        Insert: {
          cafe_id?: number | null;
          created_at?: string;
          id?: string;
          invitee_id?: string | null;
          inviter_id: string;
          meetup_date: string;
          status?: Database['public']['Enums']['invitation_status'];
          token?: string | null;
          updated_at?: string;
        };
        Update: {
          cafe_id?: number | null;
          created_at?: string;
          id?: string;
          invitee_id?: string | null;
          inviter_id?: string;
          meetup_date?: string;
          status?: Database['public']['Enums']['invitation_status'];
          token?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invitations_cafe_id_fkey';
            columns: ['cafe_id'];
            isOneToOne: false;
            referencedRelation: 'cafes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_cafe_id_fkey';
            columns: ['cafe_id'];
            isOneToOne: false;
            referencedRelation: 'random_coffee_shops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_invitee_id_fkey';
            columns: ['invitee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_inviter_id_fkey';
            columns: ['inviter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_badges: {
        Row: {
          badge_id: string;
          created_at: string;
          id: number;
          profile_id: string;
        };
        Insert: {
          badge_id: string;
          created_at?: string;
          id?: number;
          profile_id: string;
        };
        Update: {
          badge_id?: string;
          created_at?: string;
          id?: number;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'badges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profile_badges_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          cafe_preferences: Json | null;
          email: string | null;
          emoji: string | null;
          favorite_tags: string[] | null;
          firstName: string | null;
          full_name: string | null;
          id: string;
          is_beta_user: boolean | null;
          last_seen_at: string | null;
          lastName: string | null;
          preferences: Json | null;
          preferred_language: string | null;
          price_preference: string[] | null;
          updated_at: string | null;
          username: string | null;
          wants_notifications: boolean | null;
          wants_reminders: boolean | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          cafe_preferences?: Json | null;
          email?: string | null;
          emoji?: string | null;
          favorite_tags?: string[] | null;
          firstName?: string | null;
          full_name?: string | null;
          id: string;
          is_beta_user?: boolean | null;
          last_seen_at?: string | null;
          lastName?: string | null;
          preferences?: Json | null;
          preferred_language?: string | null;
          price_preference?: string[] | null;
          updated_at?: string | null;
          username?: string | null;
          wants_notifications?: boolean | null;
          wants_reminders?: boolean | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          cafe_preferences?: Json | null;
          email?: string | null;
          emoji?: string | null;
          favorite_tags?: string[] | null;
          firstName?: string | null;
          full_name?: string | null;
          id?: string;
          is_beta_user?: boolean | null;
          last_seen_at?: string | null;
          lastName?: string | null;
          preferences?: Json | null;
          preferred_language?: string | null;
          price_preference?: string[] | null;
          updated_at?: string | null;
          username?: string | null;
          wants_notifications?: boolean | null;
          wants_reminders?: boolean | null;
          website?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      random_coffee_shops: {
        Row: {
          address: string | null;
          city: string | null;
          id: number | null;
          name: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      email: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      jwt: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      uid: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      friend_request_status: 'pending' | 'accepted' | 'rejected';
      invitation_status: 'pending' | 'accepted' | 'declined';
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      friend_request_status: ['pending', 'accepted', 'rejected'],
      invitation_status: ['pending', 'accepted', 'declined'],
    },
  },
} as const;
