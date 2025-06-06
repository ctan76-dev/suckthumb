// types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          content: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          content: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          content?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
