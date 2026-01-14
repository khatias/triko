// src/types/supabase.ts

export type Database = {
  public: {
    Tables: {
      products: {
        Row: { id: string };
        Insert: {
          status: "draft" | "active" | "archived";
          name_en: string;
          name_ka: string;
          slug: string;
          price_cents: number;
          description_en?: string | null;
          description_ka?: string | null;
          primary_image_url?: string | null;
          position?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };

      product_categories: {
        Row: { product_id: string; category_id: string; position: number };
        Insert: { product_id: string; category_id: string; position: number };
        Update: Partial<{ position: number }>;
        Relationships: [];
      };

      product_variants: {
        Row: {
          product_id: string;
          color_id: string;
          size_id: string;
          color: string;
          size: string;
          is_active: boolean;
        };
        Insert: {
          product_id: string;
          color_id: string;
          size_id: string;
          color: string;
          size: string;
          is_active: boolean;
        };
        Update: Partial<{ is_active: boolean }>;
        Relationships: [];
      };

      colors: {
        Row: { id: string; code: string; hex: string | null };
        Insert: { code: string; hex?: string | null };
        Update: Partial<{ code: string; hex: string | null }>;
        Relationships: [];
      };

      sizes: {
        Row: { id: string; code: string };
        Insert: { code: string };
        Update: Partial<{ code: string }>;
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
