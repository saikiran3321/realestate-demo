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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      employee_categories: {
        Row: {
          id: string
          name: string
          position: number
          share_type: string
          share_value: number
        }
        Insert: {
          id?: string
          name: string
          position?: number
          share_type?: string
          share_value?: number
        }
        Update: {
          id?: string
          name?: string
          position?: number
          share_type?: string
          share_value?: number
        }
        Relationships: []
      }
      employees: {
        Row: {
          category_id: string
          email: string
          id: string
          name: string
          phone: string
          team_id: string | null
        }
        Insert: {
          category_id: string
          email?: string
          id?: string
          name: string
          phone?: string
          team_id?: string | null
        }
        Update: {
          category_id?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "employee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          baths: number
          beds: number
          category_id: string
          city: string
          cutoff: number
          cutoff_basis: string
          cutoff_type: string
          id: string
          price: number
          sale_discount: number
          shares: Json
          sold_by: string | null
          sqft: number
          status: string
          units: number
        }
        Insert: {
          address: string
          baths?: number
          beds?: number
          category_id: string
          city: string
          cutoff?: number
          cutoff_basis?: string
          cutoff_type?: string
          id?: string
          price?: number
          sale_discount?: number
          shares?: Json
          sold_by?: string | null
          sqft?: number
          status?: string
          units?: number
        }
        Update: {
          address?: string
          baths?: number
          beds?: number
          category_id?: string
          city?: string
          cutoff?: number
          cutoff_basis?: string
          cutoff_type?: string
          id?: string
          price?: number
          sale_discount?: number
          shares?: Json
          sold_by?: string | null
          sqft?: number
          status?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "property_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      property_categories: {
        Row: {
          has_cutoff: boolean
          id: string
          name: string
          position: number
        }
        Insert: {
          has_cutoff?: boolean
          id?: string
          name: string
          position?: number
        }
        Update: {
          has_cutoff?: boolean
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          company_share: number
          created_at: string
          cutoff: number
          discount: number
          id: string
          list_price: number
          property_id: string
          sale_date: string
          sale_price: number
          sold_by: string
          split: Json
          team_id: string | null
          unit_label: string
        }
        Insert: {
          company_share?: number
          created_at?: string
          cutoff?: number
          discount?: number
          id?: string
          list_price?: number
          property_id: string
          sale_date?: string
          sale_price?: number
          sold_by: string
          split?: Json
          team_id?: string | null
          unit_label?: string
        }
        Update: {
          company_share?: number
          created_at?: string
          cutoff?: number
          discount?: number
          id?: string
          list_price?: number
          property_id?: string
          sale_date?: string
          sale_price?: number
          sold_by?: string
          split?: Json
          team_id?: string | null
          unit_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      save_crm_team: {
        Args: { existing_id?: string; member_ids: string[]; team_name: string }
        Returns: string
      }
      swap_designations: {
        Args: { first_id: string; second_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
