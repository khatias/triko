// src/types/supabase.ts

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          status: "draft" | "active" | "archived";
          name_en: string | null;
          name_ka: string | null;
          slug: string | null;
          price_cents: number | null;
          description_en: string | null;
          description_ka: string | null;
          primary_image_url: string | null;
          primary_image_path: string | null;
          position: number | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          status: "draft" | "active" | "archived";
          name_en: string;
          name_ka: string;
          slug: string;
          price_cents: number;
          description_en?: string | null;
          description_ka?: string | null;
          primary_image_url?: string | null;
          primary_image_path?: string | null;
          position?: number | null;
          updated_at?: string | null;
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
          id: string;
          product_id: string;
          color_id: string;
          size_id: string;
          color: string | null;
          size: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          color_id: string;
          size_id: string;
          color?: string | null;
          size?: string | null;
          is_active?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };

      // ✅ ADD THIS
      product_images: {
        Row: {
          product_id: string;
          storage_path: string;
          url: string;
          position: number | null;
        };
        Insert: {
          product_id: string;
          storage_path: string;
          url: string;
          position?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };

      // ✅ ADD THIS
      product_color_images: {
        Row: {
          product_id: string;
          color_id: string;
          storage_path: string;
          url: string;
          position: number | null;
        };
        Insert: {
          product_id: string;
          color_id: string;
          storage_path: string;
          url: string;
          position?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_color_images"]["Insert"]>;
        Relationships: [];
      };

      colors: {
        Row: {
          id: string;
          code: string;
          name_en: string | null;
          name_ka: string | null;
          hex: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name_en?: string | null;
          name_ka?: string | null;
          hex?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["colors"]["Insert"]>;
        Relationships: [];
      };

      sizes: {
        Row: { id: string; code: string };
        Insert: { id?: string; code: string };
        Update: Partial<Database["public"]["Tables"]["sizes"]["Insert"]>;
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
