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
      audit_events: {
        Row: {
          action: string
          actor_name: string | null
          actor_user_id: string | null
          created_at: string
          detail: Json
          entity: string
          entity_id: string | null
          id: string
          room: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          detail?: Json
          entity: string
          entity_id?: string | null
          id?: string
          room?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          detail?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          room?: string | null
        }
        Relationships: []
      }
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
      guest_auth_attempts: {
        Row: {
          created_at: string
          id: string
          identifier: string
          scope: string
          succeeded: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          scope: string
          succeeded?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          scope?: string
          succeeded?: boolean
        }
        Relationships: []
      }
      guest_messages: {
        Row: {
          author_name: string | null
          author_staff_id: string | null
          body: string
          created_at: string
          id: string
          read_by_guest: boolean
          read_by_staff: boolean
          room: string
          sender: string
        }
        Insert: {
          author_name?: string | null
          author_staff_id?: string | null
          body: string
          created_at?: string
          id?: string
          read_by_guest?: boolean
          read_by_staff?: boolean
          room: string
          sender?: string
        }
        Update: {
          author_name?: string | null
          author_staff_id?: string | null
          body?: string
          created_at?: string
          id?: string
          read_by_guest?: boolean
          read_by_staff?: boolean
          room?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_messages_author_staff_id_fkey"
            columns: ["author_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_secrets: {
        Row: {
          name: string
          updated_at: string
          value: string
        }
        Insert: {
          name: string
          updated_at?: string
          value: string
        }
        Update: {
          name?: string
          updated_at?: string
          value?: string
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
      request_notes: {
        Row: {
          author_name: string | null
          author_staff_id: string | null
          body: string | null
          created_at: string
          id: string
          request_id: string
          status_from: string | null
          status_to: string | null
        }
        Insert: {
          author_name?: string | null
          author_staff_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          request_id: string
          status_from?: string | null
          status_to?: string | null
        }
        Update: {
          author_name?: string | null
          author_staff_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          request_id?: string
          status_from?: string | null
          status_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_notes_author_staff_id_fkey"
            columns: ["author_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_notes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
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
          started_at: string | null
          started_by_name: string | null
          started_by_staff_id: string | null
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
          started_at?: string | null
          started_by_name?: string | null
          started_by_staff_id?: string | null
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
          started_at?: string | null
          started_by_name?: string | null
          started_by_staff_id?: string | null
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
          {
            foreignKeyName: "requests_started_by_staff_id_fkey"
            columns: ["started_by_staff_id"]
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
      room_rates: {
        Row: {
          beds: string
          created_at: string
          label: string
          max_occupancy: number
          nightly_rate: number
          room_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          beds: string
          created_at?: string
          label: string
          max_occupancy: number
          nightly_rate: number
          room_type: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          beds?: string
          created_at?: string
          label?: string
          max_occupancy?: number
          nightly_rate?: number
          room_type?: string
          sort_order?: number
          updated_at?: string
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
          door_pin: string | null
          door_pin_set_at: string | null
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
          door_pin?: string | null
          door_pin_set_at?: string | null
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
          door_pin?: string | null
          door_pin_set_at?: string | null
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
      shift_room_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          room_id: string | null
          room_number: string
          schedule_id: string
          staff_member_id: string
          staff_name: string
          work_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          room_id?: string | null
          room_number: string
          schedule_id: string
          staff_member_id: string
          staff_name: string
          work_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          room_id?: string | null
          room_number?: string
          schedule_id?: string
          staff_member_id?: string
          staff_name?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_room_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "staff_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_room_assignments_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          last_send_channel: string | null
          last_sent_at: string | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          sent_count: number
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          id?: string
          last_send_channel?: string | null
          last_sent_at?: string | null
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          sent_count?: number
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          last_send_channel?: string | null
          last_sent_at?: string | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          sent_count?: number
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          department: string
          id: string
          is_supervisor: boolean
          name: string
          pin: string | null
          sms_alerts: boolean
          sms_phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string
          id?: string
          is_supervisor?: boolean
          name: string
          pin?: string | null
          sms_alerts?: boolean
          sms_phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string
          id?: string
          is_supervisor?: boolean
          name?: string
          pin?: string | null
          sms_alerts?: boolean
          sms_phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          end_time: string
          id: string
          notes: string | null
          published: boolean
          staff_member_id: string
          staff_name: string
          start_time: string
          updated_at: string
          work_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string
          end_time?: string
          id?: string
          notes?: string | null
          published?: boolean
          staff_member_id: string
          staff_name: string
          start_time?: string
          updated_at?: string
          work_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          end_time?: string
          id?: string
          notes?: string | null
          published?: boolean
          staff_member_id?: string
          staff_name?: string
          start_time?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          clock_in_at: string
          clock_out_at: string | null
          created_at: string
          department: string
          duration_seconds: number | null
          id: string
          staff_member_id: string
          staff_name: string
          updated_at: string
        }
        Insert: {
          clock_in_at?: string
          clock_out_at?: string | null
          created_at?: string
          department?: string
          duration_seconds?: number | null
          id?: string
          staff_member_id: string
          staff_name: string
          updated_at?: string
        }
        Update: {
          clock_in_at?: string
          clock_out_at?: string | null
          created_at?: string
          department?: string
          duration_seconds?: number | null
          id?: string
          staff_member_id?: string
          staff_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
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
      check_availability: {
        Args: { _check_in: string; _check_out: string; _guests?: number }
        Returns: {
          available_count: number
          beds: string
          label: string
          max_occupancy: number
          nightly_rate: number
          room_type: string
        }[]
      }
      current_staff_member_id: { Args: never; Returns: string }
      is_supervisor: { Args: never; Returns: boolean }
      mask_guest_name: { Args: { name: string }; Returns: string }
      requests_board: {
        Args: never
        Returns: {
          created_at: string
          details: string
          guest_name: string
          id: string
          resolved_at: string
          resolved_by_name: string
          response_seconds: number
          room: string
          started_at: string
          started_by_name: string
          status: string
          type: string
          updated_at: string
        }[]
      }
      room_type_key: { Args: { _bed_type: string }; Returns: string }
      rooms_board: {
        Args: never
        Returns: {
          assigned_at: string
          assigned_name: string
          assigned_staff_id: string
          bed_type: string
          check_in: string
          check_out: string
          created_at: string
          dnd: boolean
          extended_stay: boolean
          floor: number
          guest_name: string
          id: string
          notes: string
          number: string
          original_check_out: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "manager" | "staff" | "viewer" | "housekeeper"
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
      app_role: ["manager", "staff", "viewer", "housekeeper"],
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
