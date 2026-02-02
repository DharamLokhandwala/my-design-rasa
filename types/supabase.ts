// Minimal Supabase Database types for this project.
// Keep in sync with `supabase/migrations/*`.

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
      projects: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          title: string;
          image_url: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          title: string;
          image_url: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          title?: string;
          image_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reflections: {
        Row: {
          id: string;
          created_at: string;
          project_id: string;
          lexicons: string[];
          explanation: string;
          image_url: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          project_id: string;
          lexicons?: string[];
          explanation?: string;
          image_url: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          project_id?: string;
          lexicons?: string[];
          explanation?: string;
          image_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reflections_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      glimpse_summaries: {
        Row: {
          user_id: string;
          reflection_ids_key: string;
          summary: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          reflection_ids_key?: string;
          summary?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          reflection_ids_key?: string;
          summary?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "glimpse_summaries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

