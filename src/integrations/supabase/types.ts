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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          contact_number: string
          created_at: string | null
          id: string
          id_proof: string | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_number: string
          created_at?: string | null
          id?: string
          id_proof?: string | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_number?: string
          created_at?: string | null
          id?: string
          id_proof?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          carry_forward_amount: number | null
          created_at: string | null
          customer_id: string
          emi_amount: number | null
          id: string
          interest_rate: number | null
          loan_type: Database["public"]["Enums"]["loan_type"]
          next_due_date: string | null
          principal_amount: number
          remaining_balance: number | null
          remaining_tenure: number | null
          start_date: string
          status: Database["public"]["Enums"]["loan_status"] | null
          tenure_months: number | null
          total_collected: number | null
          total_interest: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          carry_forward_amount?: number | null
          created_at?: string | null
          customer_id: string
          emi_amount?: number | null
          id?: string
          interest_rate?: number | null
          loan_type: Database["public"]["Enums"]["loan_type"]
          next_due_date?: string | null
          principal_amount: number
          remaining_balance?: number | null
          remaining_tenure?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"] | null
          tenure_months?: number | null
          total_collected?: number | null
          total_interest?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          carry_forward_amount?: number | null
          created_at?: string | null
          customer_id?: string
          emi_amount?: number | null
          id?: string
          interest_rate?: number | null
          loan_type?: Database["public"]["Enums"]["loan_type"]
          next_due_date?: string | null
          principal_amount?: number
          remaining_balance?: number | null
          remaining_tenure?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"] | null
          tenure_months?: number | null
          total_collected?: number | null
          total_interest?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string
          id: string
          loan_id: string
          notes: string | null
          payment_category: string | null
          payment_date: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id: string
          id?: string
          loan_id: string
          notes?: string | null
          payment_category?: string | null
          payment_date: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          loan_id?: string
          notes?: string | null
          payment_category?: string | null
          payment_date?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_fixed_interest: {
        Args: { principal: number; rate: number }
        Returns: number
      }
      calculate_next_due_date: {
        Args: { loan_start_date: string; payments_count: number }
        Returns: string
      }
      check_overdue_loans: { Args: never; Returns: undefined }
    }
    Enums: {
      loan_status: "active" | "completed" | "overdue" | "closed"
      loan_type: "fixed_interest" | "emi"
      payment_type: "cash" | "online" | "cheque"
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
      loan_status: ["active", "completed", "overdue", "closed"],
      loan_type: ["fixed_interest", "emi"],
      payment_type: ["cash", "online", "cheque"],
    },
  },
} as const
