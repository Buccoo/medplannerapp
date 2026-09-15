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
      appointment_revisions: {
        Row: {
          action: string
          actor_id: string | null
          appointment_id: string
          change_set_id: string | null
          created_at: string
          id: number
          new_values: Json | null
          old_values: Json | null
          source: string
          user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          appointment_id: string
          change_set_id?: string | null
          created_at?: string
          id?: never
          new_values?: Json | null
          old_values?: Json | null
          source: string
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          appointment_id?: string
          change_set_id?: string | null
          created_at?: string
          id?: never
          new_values?: Json | null
          old_values?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_revisions_change_set_id_fkey"
            columns: ["change_set_id"]
            isOneToOne: false
            referencedRelation: "change_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          address: string | null
          booking_source: string | null
          change_set_id: string | null
          created_at: string
          current_visit_notes: string | null
          date: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          doctor_id: string | null
          id: string
          is_locked: boolean
          last_visit_date: string | null
          last_visit_notes: string | null
          locked_reason: string | null
          microarea: string | null
          name: string
          next_appointment_draft: string | null
          order_file: string | null
          paese: string | null
          phone: string | null
          planning_status: string
          products: Json | null
          secretary_notes: string | null
          source: string
          status: string
          time: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          booking_source?: string | null
          change_set_id?: string | null
          created_at?: string
          current_visit_notes?: string | null
          date: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          doctor_id?: string | null
          id?: string
          is_locked?: boolean
          last_visit_date?: string | null
          last_visit_notes?: string | null
          locked_reason?: string | null
          microarea?: string | null
          name: string
          next_appointment_draft?: string | null
          order_file?: string | null
          paese?: string | null
          phone?: string | null
          planning_status?: string
          products?: Json | null
          secretary_notes?: string | null
          source?: string
          status?: string
          time: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          booking_source?: string | null
          change_set_id?: string | null
          created_at?: string
          current_visit_notes?: string | null
          date?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          doctor_id?: string | null
          id?: string
          is_locked?: boolean
          last_visit_date?: string | null
          last_visit_notes?: string | null
          locked_reason?: string | null
          microarea?: string | null
          name?: string
          next_appointment_draft?: string | null
          order_file?: string | null
          paese?: string | null
          phone?: string | null
          planning_status?: string
          products?: Json | null
          secretary_notes?: string | null
          source?: string
          status?: string
          time?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_change_set_id_fkey"
            columns: ["change_set_id"]
            isOneToOne: false
            referencedRelation: "change_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          change_set_id: string | null
          created_at: string
          diff: Json
          entity_id: string | null
          entity_type: string
          id: number
          snapshot: Json | null
          source: string
          user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          change_set_id?: string | null
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
          snapshot?: Json | null
          source?: string
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          change_set_id?: string | null
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
          snapshot?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_change_set_id_fkey"
            columns: ["change_set_id"]
            isOneToOne: false
            referencedRelation: "change_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      change_set_items: {
        Row: {
          action: string
          change_set_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action: string
          change_set_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          change_set_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_set_items_change_set_id_fkey"
            columns: ["change_set_id"]
            isOneToOne: false
            referencedRelation: "change_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      change_sets: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string
          id: string
          idempotency_key: string | null
          kind: string
          source: string
          status: string
          summary: Json
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key?: string | null
          kind: string
          source?: string
          status?: string
          summary?: Json
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key?: string | null
          kind?: string
          source?: string
          status?: string
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      coverage_import_staging: {
        Row: {
          applied_at: string | null
          classification: string
          error_message: string | null
          id: string
          import_id: string
          normalized_data: Json
          raw_data: Json
          row_number: number
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          classification: string
          error_message?: string | null
          id?: string
          import_id: string
          normalized_data: Json
          raw_data: Json
          row_number: number
          user_id: string
        }
        Update: {
          applied_at?: string | null
          classification?: string
          error_message?: string | null
          id?: string
          import_id?: string
          normalized_data?: Json
          raw_data?: Json
          row_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_import_staging_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_inputs: {
        Row: {
          actual_value: number | null
          created_at: string
          cycle_end: string
          cycle_start: string
          id: string
          input_type: string
          metadata: Json
          microarea: string
          planned_days: number | null
          product_id: string | null
          source_import_id: string | null
          target_value: number | null
          user_id: string
        }
        Insert: {
          actual_value?: number | null
          created_at?: string
          cycle_end: string
          cycle_start: string
          id?: string
          input_type: string
          metadata?: Json
          microarea: string
          planned_days?: number | null
          product_id?: string | null
          source_import_id?: string | null
          target_value?: number | null
          user_id: string
        }
        Update: {
          actual_value?: number | null
          created_at?: string
          cycle_end?: string
          cycle_start?: string
          id?: string
          input_type?: string
          metadata?: Json
          microarea?: string
          planned_days?: number | null
          product_id?: string | null
          source_import_id?: string | null
          target_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_inputs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_inputs_source_import_id_fkey"
            columns: ["source_import_id"]
            isOneToOne: false
            referencedRelation: "imports"
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
      data_snapshots: {
        Row: {
          change_set_id: string | null
          created_at: string
          created_by: string | null
          id: string
          payload: Json
          snapshot_type: string
          user_id: string
        }
        Insert: {
          change_set_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payload: Json
          snapshot_type: string
          user_id: string
        }
        Update: {
          change_set_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          snapshot_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_snapshots_change_set_id_fkey"
            columns: ["change_set_id"]
            isOneToOne: false
            referencedRelation: "change_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_facilities: {
        Row: {
          created_at: string
          doctor_id: string
          facility_id: string
          notes: string
          preferred_hours: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          facility_id: string
          notes?: string
          preferred_hours?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          facility_id?: string
          notes?: string
          preferred_hours?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_facilities_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "healthcare_facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_product_rules: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_goal: number
          priority: number
          product_id: string
          rationale: string
          source_import_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_goal?: number
          priority?: number
          product_id: string
          rationale?: string
          source_import_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_goal?: number
          priority?: number
          product_id?: string
          rationale?: string
          source_import_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_product_rules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_product_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_product_rules_source_import_id_fkey"
            columns: ["source_import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          address: string | null
          birth_year: number | null
          c_client: boolean
          created_at: string
          current_visit_notes: string | null
          external_id: string | null
          external_source: string | null
          id: string
          k_client: boolean
          last_visit_date: string | null
          last_visit_notes: string | null
          manual_fields: string[]
          microarea: string | null
          name: string
          normalized_name: string | null
          office_hours: Json | null
          paese: string | null
          phone: string | null
          source_updated_at: string | null
          specialty: string
          sync_status: string
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
          external_id?: string | null
          external_source?: string | null
          id?: string
          k_client?: boolean
          last_visit_date?: string | null
          last_visit_notes?: string | null
          manual_fields?: string[]
          microarea?: string | null
          name: string
          normalized_name?: string | null
          office_hours?: Json | null
          paese?: string | null
          phone?: string | null
          source_updated_at?: string | null
          specialty?: string
          sync_status?: string
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
          external_id?: string | null
          external_source?: string | null
          id?: string
          k_client?: boolean
          last_visit_date?: string | null
          last_visit_notes?: string | null
          manual_fields?: string[]
          microarea?: string | null
          name?: string
          normalized_name?: string | null
          office_hours?: Json | null
          paese?: string | null
          phone?: string | null
          source_updated_at?: string | null
          specialty?: string
          sync_status?: string
          target_class?: string | null
          updated_at?: string
          user_id?: string
          visits?: number
        }
        Relationships: []
      }
      healthcare_facilities: {
        Row: {
          active: boolean
          address: string
          created_at: string
          facility_type: string
          id: string
          latitude: number | null
          longitude: number | null
          microarea: string
          name: string
          notes: string
          paese: string
          preferred_hours: Json
          structure_slot_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          address?: string
          created_at?: string
          facility_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          microarea?: string
          name: string
          notes?: string
          paese?: string
          preferred_hours?: Json
          structure_slot_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          facility_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          microarea?: string
          name?: string
          notes?: string
          paese?: string
          preferred_hours?: Json
          structure_slot_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_staging: {
        Row: {
          applied_at: string | null
          classification: string
          confidence: number | null
          diff: Json
          id: string
          import_id: string
          matched_doctor_id: string | null
          normalized_data: Json
          raw_data: Json
          resolution: string | null
          row_number: number
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          classification: string
          confidence?: number | null
          diff?: Json
          id?: string
          import_id: string
          matched_doctor_id?: string | null
          normalized_data: Json
          raw_data: Json
          resolution?: string | null
          row_number: number
          user_id: string
        }
        Update: {
          applied_at?: string | null
          classification?: string
          confidence?: number | null
          diff?: Json
          id?: string
          import_id?: string
          matched_doctor_id?: string | null
          normalized_data?: Json
          raw_data?: Json
          resolution?: string | null
          row_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_staging_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_staging_matched_doctor_id_fkey"
            columns: ["matched_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string
          file_hash: string
          file_name: string
          id: string
          import_type: string
          mapping: Json
          report: Json
          source_name: string
          status: string
          storage_path: string
          total_records: number
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string
          file_hash: string
          file_name: string
          id?: string
          import_type: string
          mapping?: Json
          report?: Json
          source_name?: string
          status?: string
          storage_path: string
          total_records?: number
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string
          file_hash?: string
          file_name?: string
          id?: string
          import_type?: string
          mapping?: Json
          report?: Json
          source_name?: string
          status?: string
          storage_path?: string
          total_records?: number
          user_id?: string
        }
        Relationships: []
      }
      mcp_access_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          token_hash: string
          token_prefix: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          token_hash: string
          token_prefix: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          token_hash?: string
          token_prefix?: string
          user_id?: string
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
      plan_conflicts: {
        Row: {
          conflict_type: string
          context: Json
          created_at: string
          id: string
          message: string
          resolved_at: string | null
          severity: string
          user_id: string
          weekly_plan_id: string
        }
        Insert: {
          conflict_type: string
          context?: Json
          created_at?: string
          id?: string
          message: string
          resolved_at?: string | null
          severity?: string
          user_id: string
          weekly_plan_id: string
        }
        Update: {
          conflict_type?: string
          context?: Json
          created_at?: string
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: string
          user_id?: string
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_conflicts_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
        ]
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
      visit_product_goals: {
        Row: {
          appointment_id: string
          created_at: string
          doctor_id: string | null
          id: string
          patient_goal: number
          priority: number
          product_id: string
          rationale: string
          user_id: string
          weekly_plan_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_goal: number
          priority?: number
          product_id: string
          rationale?: string
          user_id: string
          weekly_plan_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_goal?: number
          priority?: number
          product_id?: string
          rationale?: string
          user_id?: string
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_product_goals_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_product_goals_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_product_goals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_product_goals_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plan_days: {
        Row: {
          created_at: string
          id: string
          microarea: string
          notes: string
          plan_date: string
          user_id: string
          weekly_plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          microarea: string
          notes?: string
          plan_date: string
          user_id: string
          weekly_plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          microarea?: string
          notes?: string
          plan_date?: string
          user_id?: string
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plan_days_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plans: {
        Row: {
          change_set_id: string | null
          created_at: string
          created_by: string
          id: string
          rationale: Json
          status: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          change_set_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          rationale?: Json
          status?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          change_set_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          rationale?: Json
          status?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plans_change_set_id_fkey"
            columns: ["change_set_id"]
            isOneToOne: false
            referencedRelation: "change_sets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      apply_certain_doctor_import: {
        Args: { p_idempotency_key: string; p_import_id: string }
        Returns: Json
      }
      apply_coverage_import: {
        Args: { p_idempotency_key: string; p_import_id: string }
        Returns: Json
      }
      approve_weekly_plan: { Args: { p_plan_id: string }; Returns: number }
      create_daily_snapshots_all_users: { Args: never; Returns: number }
      create_data_snapshot: {
        Args: { p_change_set_id?: string; p_type?: string }
        Returns: string
      }
      create_mcp_access_token: {
        Args: {
          p_expires_at?: string
          p_name: string
          p_token_hash: string
          p_token_prefix: string
        }
        Returns: string
      }
      daily_sample_bag: {
        Args: { p_date: string }
        Returns: {
          product_id: string
          product_name: string
          samples: number
        }[]
      }
      generate_weekly_plan: {
        Args: { p_idempotency_key: string; p_week_start: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      jsonb_diff: { Args: { new_row: Json; old_row: Json }; Returns: Json }
      mcp_daily_sample_bag: {
        Args: { p_date: string; p_user_id: string }
        Returns: {
          product_id: string
          product_name: string
          samples: number
        }[]
      }
      mcp_generate_weekly_plan: {
        Args: {
          p_idempotency_key: string
          p_user_id: string
          p_week_start: string
        }
        Returns: Json
      }
      resolve_import_row: {
        Args: { p_resolution: string; p_row_id: string }
        Returns: undefined
      }
      restore_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      restore_change_set: { Args: { p_change_set_id: string }; Returns: Json }
      revoke_mcp_access_token: {
        Args: { p_token_id: string }
        Returns: boolean
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
