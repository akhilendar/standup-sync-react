export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          employee_id: string | null
          id: string
          marked_at: string | null
          marked_by: string | null
          standup_id: string | null
          status: string | null
        }
        Insert: {
          employee_id?: string | null
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          standup_id?: string | null
          status?: string | null
        }
        Update: {
          employee_id?: string | null
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          standup_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey1"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "attendance_standup_id_fkey"
            columns: ["standup_id"]
            isOneToOne: false
            referencedRelation: "standups"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          email: string
          employee_id: string
          name: string
          ratings_sheet_link: string | null
          role: string | null
        }
        Insert: {
          email: string
          employee_id: string
          name: string
          ratings_sheet_link?: string | null
          role?: string | null
        }
        Update: {
          email?: string
          employee_id?: string
          name?: string
          ratings_sheet_link?: string | null
          role?: string | null
        }
        Relationships: []
      }
      learning_hours: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          scheduled_at: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_at: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_at?: string
        }
        Relationships: []
      }
      learning_hours_attendance: {
        Row: {
          employee_id: string | null
          id: string
          learning_hour_id: string | null
          marked_at: string | null
          marked_by: string | null
          status: string | null
        }
        Insert: {
          employee_id?: string | null
          id?: string
          learning_hour_id?: string | null
          marked_at?: string | null
          marked_by?: string | null
          status?: string | null
        }
        Update: {
          employee_id?: string | null
          id?: string
          learning_hour_id?: string | null
          marked_at?: string | null
          marked_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_hours_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "learning_hours_attendance_learning_hour_id_fkey"
            columns: ["learning_hour_id"]
            isOneToOne: false
            referencedRelation: "learning_hours"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      standups: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          scheduled_at: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_at: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_at?: string
        }
        Relationships: []
      }
      worklog_categories: {
        Row: {
          id: number
          name: string | null
          type: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          type?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          type?: string | null
        }
        Relationships: []
      }
      worklog_subcategory: {
        Row: {
          category_id: number | null
          id: number
          name: string | null
        }
        Insert: {
          category_id?: number | null
          id?: number
          name?: string | null
        }
        Update: {
          category_id?: number | null
          id?: number
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worklog_subcategory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "worklog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
