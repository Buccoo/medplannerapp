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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          address: string | null
          booking_source: string | null
          created_at: string
          current_visit_notes: string | null
          date: string
          deleted_at: string | null
          deleted_by: string | null
          delete_reason: string | null
          doctor_id: string | null
          id: string
          is_locked: boolean
          last_visit_date: string | null
          last_visit_notes: string | null
          microarea: string | null
          name: string
          next_appointment_draft: string | null
          order_file: string | null
          paese: string | null
          phone: string | null
          products: Json | null
          secretary_notes: string | null
          status: string
          planning_status: string
          locked_reason: string | null
          source: string
          change_set_id: string | null
          time: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          booking_source?: string | null
          created_at?: string
          current_visit_notes?: string | null
          date: string
          deleted_at?: string | null
          deleted_by?: string | null
          delete_reason?: string | null
          doctor_id?: string | null
          id?: string
          is_locked?: boolean
          last_visit_date?: string | null
          last_visit_notes?: string | null
          microarea?: string | null
          name: string
          next_appointment_draft?: string | null
          order_file?: string | null
          paese?: string | null
          phone?: string | null
          products?: Json | null
          secretary_notes?: string | null
          status?: string
          planning_status?: string
          locked_reason?: string | null
          source?: string
          change_set_id?: string | null
          time: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          booking_source?: string | null
          created_at?: string
          current_visit_notes?: string | null
          date?: string
          deleted_at?: string | null
          deleted_by?: string | null
          delete_reason?: string | null
          doctor_id?: string | null
          id?: string
          is_locked?: boolean
          last_visit_date?: string | null
          last_visit_notes?: string | null
          microarea?: string | null
          name?: string
          next_appointment_draft?: string | null
          order_file?: string | null
          paese?: string | null
          phone?: string | null
          products?: Json | null
          secretary_notes?: string | null
          status?: string
          planning_status?: string
          locked_reason?: string | null
          source?: string
          change_set_id?: string | null
          time?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      archive_files: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archive_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "archive_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archive_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "archive_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_priorities: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          address: string | null
          birth_year: number | null
          c_client: boolean
          created_at: string
          current_visit_notes: string | null
          id: string
          k_client: boolean
          last_visit_date: string | null
          last_visit_notes: string | null
          microarea: string | null
          name: string
          office_hours: Json | null
          paese: string | null
          phone: string | null
          specialty: string
          target_class: string | null
          updated_at: string
          user_id: string
          visits: number
        }
        Insert: {
          address?: string | null
          birth_year?: number | null
          c_client?: boolean
          created_at?: string
          current_visit_notes?: string | null
          id?: string
          k_client?: boolean
          last_visit_date?: string | null
          last_visit_notes?: string | null
          microarea?: string | null
          name: string
          office_hours?: Json | null
          paese?: string | null
          phone?: string | null
          specialty?: string
          target_class?: string | null
          updated_at?: string
          user_id: string
          visits?: number
        }
        Update: {
          address?: string | null
          birth_year?: number | null
          c_client?: boolean
          created_at?: string
          current_visit_notes?: string | null
          id?: string
          k_client?: boolean
          last_visit_date?: string | null
          last_visit_notes?: string | null
          microarea?: string | null
          name?: string
          office_hours?: Json | null
          paese?: string | null
          phone?: string | null
          specialty?: string
          target_class?: string | null
          updated_at?: string
          user_id?: string
          visits?: number
        }
        Relationships: []
      }
      microarea_company_targets: {
        Row: {
          company_target: number
          created_at: string
          cycle_index: number
          id: string
          microarea: string
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_target?: number
          created_at?: string
          cycle_index: number
          id?: string
          microarea: string
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_target?: number
          created_at?: string
          cycle_index?: number
          id?: string
          microarea?: string
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      microarea_targets: {
        Row: {
          created_at: string
          cycle_index: number
          id: string
          microarea: string
          month_index: number
          product_id: string
          sold: number
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_index: number
          id?: string
          microarea: string
          month_index: number
          product_id: string
          sold?: number
          target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_index?: number
          id?: string
          microarea?: string
          month_index?: number
          product_id?: string
          sold?: number
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "microarea_targets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      microarea_towns: {
        Row: {
          created_at: string
          id: string
          microarea: string
          town: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          microarea: string
          town: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          microarea?: string
          town?: string
          user_id?: string
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          address: string | null
          created_at: string
          id: string
          microarea: string | null
          name: string
          notes: string | null
          order_file: string | null
          paese: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          microarea?: string | null
          name: string
          notes?: string | null
          order_file?: string | null
          paese?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          microarea?: string | null
          name?: string
          notes?: string | null
          order_file?: string | null
          paese?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          company_forecast: number
          created_at: string
          cycle_targets_override: Json
          cycles: Json
          id: string
          name: string
          sold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_forecast?: number
          created_at?: string
          cycle_targets_override?: Json
          cycles?: Json
          id?: string
          name: string
          sold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_forecast?: number
          created_at?: string
          cycle_targets_override?: Json
          cycles?: Json
          id?: string
          name?: string
          sold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          grace_period_ends_at: string | null
          id: string
          plan_type: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          grace_period_ends_at?: string | null
          id?: string
          plan_type?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          grace_period_ends_at?: string | null
          id?: string
          plan_type?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_settings: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          zona: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          zona?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          zona?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_certain_doctor_import: {
        Args: { p_import_id: string; p_idempotency_key: string }
        Returns: Json
      }
      approve_weekly_plan: {
        Args: { p_plan_id: string }
        Returns: number
      }
      admin_get_all_users: {
        Args: never
        Returns: {
          appointments_count: number
          created_at: string
          current_period_end: string
          display_name: string
          doctors_count: number
          email: string
          pharmacies_count: number
          plan_type: string
          sub_status: string
          user_id: string
          zona: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      create_data_snapshot: {
        Args: { p_type?: string; p_change_set_id?: string | null }
        Returns: string
      }
      daily_sample_bag: {
        Args: { p_date: string }
        Returns: { product_id: string; product_name: string; samples: number }[]
      }
      restore_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      soft_delete_appointment: {
        Args: { p_appointment_id: string; p_reason: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
