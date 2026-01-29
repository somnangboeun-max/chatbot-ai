/**
 * Database Types for Supabase
 *
 * IMPORTANT: This file should be regenerated after applying migrations.
 * Run: npm run db:types
 *
 * This is a manual placeholder created during Story 1.5 implementation.
 * Once migrations are applied to local Supabase, regenerate with:
 * supabase gen types typescript --local > types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          bot_active: boolean;
          bot_paused_at: string | null;
          onboarding_completed: boolean;
          opening_hours: Json | null;
          address: string | null;
          phone: string | null;
          facebook_page_id: string | null;
          facebook_page_name: string | null;
          facebook_page_avatar_url: string | null;
          facebook_access_token: string | null;
          facebook_connected_at: string | null;
          notification_method: "telegram" | "sms" | null;
          notification_target: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name?: string;
          bot_active?: boolean;
          bot_paused_at?: string | null;
          onboarding_completed?: boolean;
          opening_hours?: Json | null;
          address?: string | null;
          phone?: string | null;
          facebook_page_id?: string | null;
          facebook_page_name?: string | null;
          facebook_page_avatar_url?: string | null;
          facebook_access_token?: string | null;
          facebook_connected_at?: string | null;
          notification_method?: "telegram" | "sms" | null;
          notification_target?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          bot_active?: boolean;
          bot_paused_at?: string | null;
          onboarding_completed?: boolean;
          opening_hours?: Json | null;
          address?: string | null;
          phone?: string | null;
          facebook_page_id?: string | null;
          facebook_page_name?: string | null;
          facebook_page_avatar_url?: string | null;
          facebook_access_token?: string | null;
          facebook_connected_at?: string | null;
          notification_method?: "telegram" | "sms" | null;
          notification_target?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          price: number;
          currency: "USD" | "KHR";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          price: number;
          currency?: "USD" | "KHR";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          price?: number;
          currency?: "USD" | "KHR";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string;
          facebook_sender_id: string | null;
          customer_name: string | null;
          customer_avatar_url: string | null;
          status: "active" | "bot_handled" | "needs_attention" | "owner_handled";
          last_message_at: string | null;
          viewed_at: string | null;
          handover_reason: "low_confidence" | "customer_frustrated" | "human_requested" | "complex_question" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id: string;
          facebook_sender_id?: string | null;
          customer_name?: string | null;
          customer_avatar_url?: string | null;
          status?: "active" | "bot_handled" | "needs_attention" | "owner_handled";
          last_message_at?: string | null;
          viewed_at?: string | null;
          handover_reason?: "low_confidence" | "customer_frustrated" | "human_requested" | "complex_question" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string;
          facebook_sender_id?: string | null;
          customer_name?: string | null;
          customer_avatar_url?: string | null;
          status?: "active" | "bot_handled" | "needs_attention" | "owner_handled";
          last_message_at?: string | null;
          viewed_at?: string | null;
          handover_reason?: "low_confidence" | "customer_frustrated" | "human_requested" | "complex_question" | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          tenant_id: string;
          conversation_id: string;
          sender_type: "customer" | "bot" | "owner";
          content: string;
          facebook_message_id: string | null;
          is_handover_trigger: boolean;
          handover_reason: "low_confidence" | "frustration" | "human_requested" | "complex_question" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          conversation_id: string;
          sender_type: "customer" | "bot" | "owner";
          content: string;
          facebook_message_id?: string | null;
          is_handover_trigger?: boolean;
          handover_reason?: "low_confidence" | "frustration" | "human_requested" | "complex_question" | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          conversation_id?: string;
          sender_type?: "customer" | "bot" | "owner";
          content?: string;
          facebook_message_id?: string | null;
          is_handover_trigger?: boolean;
          handover_reason?: "low_confidence" | "frustration" | "human_requested" | "complex_question" | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_tenant_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      set_claim: {
        Args: {
          uid: string;
          claim: string;
          value: Json;
        };
        Returns: undefined;
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

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience type aliases
export type Business = Tables<"businesses">;
export type BusinessInsert = TablesInsert<"businesses">;
export type BusinessUpdate = TablesUpdate<"businesses">;

export type Product = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export type Conversation = Tables<"conversations">;
export type ConversationInsert = TablesInsert<"conversations">;
export type ConversationUpdate = TablesUpdate<"conversations">;

export type Message = Tables<"messages">;
export type MessageInsert = TablesInsert<"messages">;
export type MessageUpdate = TablesUpdate<"messages">;
