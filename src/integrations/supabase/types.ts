export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          guest_name: string
          id: string
          notes: string | null
          original_check_out: string | null
          phone: string | null
          room: string
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          guest_name: string
          id?: string
          notes?: string | null
          original_check_out?: string | null
          phone?: string | null
          room: string
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          guest_name?: string
          id?: string
          notes?: string | null
          original_check_out?: string | null
          phone?: string | null
          room?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          staff_id: string | null
          staff_name: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          staff_id?: string | null
          staff_name?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          staff_id?: string | null
          staff_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          created_at: string
          details: string | null
          guest_name: string | null
          id: string
          resolved_at: string | null
          resolved_by_name: string | null
          resolved_by_staff_id: string | null
          response_seconds: number | null
          room: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          guest_name?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by_name?: string | null
          resolved_by_staff_id?: string | null
          response_seconds?: number | null
          room: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          guest_name?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by_name?: string | null
          resolved_by_staff_id?: string | null
          response_seconds?: number | null
          room?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_resolved_by_staff_id_fkey"
            columns: ["resolved_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      room_qr_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          revoked_at: string | null
          room: string
          token: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          revoked_at?: string | null
          room: string
          token: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          room?: string
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: []
      }
      room_status_events: {
        Row: {
          changed_at: string
          changed_by: string | null
          duration_seconds: number | null
          id: string
          is_turnover: boolean
          new_status: Database["public"]["Enums"]["room_status"]
          old_status: Database["public"]["Enums"]["room_status"] | null
          previous_changed_at: string | null
          room_id: string | null
          room_number: string
          staff_member_id: string | null
          staff_name: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          duration_seconds?: number | null
          id?: string
          is_turnover?: boolean
          new_status: Database["public"]["Enums"]["room_status"]
          old_status?: Database["public"]["Enums"]["room_status"] | null
          previous_changed_at?: string | null
          room_id?: string | null
          room_number: string
          staff_member_id?: string | null
          staff_name?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          duration_seconds?: number | null
          id?: string
          is_turnover?: boolean
          new_status?: Database["public"]["Enums"]["room_status"]
          old_status?: Database["public"]["Enums"]["room_status"] | null
          previous_changed_at?: string | null
          room_id?: string | null
          room_number?: string
          staff_member_id?: string | null
          staff_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_status_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_status_events_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          assigned_at: string | null
          assigned_name: string | null
          assigned_staff_id: string | null
          bed_type: string
          check_in: string | null
          check_out: string | null
          created_at: string
          dnd: boolean
          extended_stay: boolean
          floor: number
          guest_name: string | null
          id: string
          notes: string | null
          number: string
          original_check_out: string | null
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_name?: string | null
          assigned_staff_id?: string | null
          bed_type?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          dnd?: boolean
          extended_stay?: boolean
          floor?: number
          guest_name?: string | null
          id?: string
          notes?: string | null
          number: string
          original_check_out?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_name?: string | null
          assigned_staff_id?: string | null
          bed_type?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          dnd?: boolean
          extended_stay?: boolean
          floor?: number
          guest_name?: string | null
          id?: string
          notes?: string | null
          number?: string
          original_check_out?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          department: string
          id: string
          name: string
          pin: string | null
          sms_alerts: boolean
          sms_phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string
          id?: string
          name: string
          pin?: string | null
          sms_alerts?: boolean
          sms_phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string
          id?: string
          name?: string
          pin?: string | null
          sms_alerts?: boolean
          sms_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "manager" | "staff" | "viewer"
      room_status:
        | "occupied"
        | "vacant_clean"
        | "vacant_dirty"
        | "out_of_order"
        | "occupied_dnd"
        | "reserved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["manager", "staff", "viewer"],
      room_status: [
        "occupied",
        "vacant_clean",
        "vacant_dirty",
        "out_of_order",
        "occupied_dnd",
        "reserved",
      ],
    },
  },
} as const
