export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          id: string;
          moment_id: string;
          user_id: string;
          user_email: string | null;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          moment_id: string;
          user_id: string;
          user_email?: string | null;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          moment_id?: string;
          user_id?: string;
          user_email?: string | null;
          text?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_moment_id_fkey';
            columns: ['moment_id'];
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          }
        ];
      };
      likes: {
        Row: {
          id: string;
          moment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          moment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          moment_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'likes_moment_id_fkey';
            columns: ['moment_id'];
            referencedRelation: 'moments';
            referencedColumns: ['id'];
          }
        ];
      };
      moments: {
        Row: {
          id: string;
          user_id: string;
          user_email: string | null;
          text: string;
          media_url: string | null;
          media_type: 'image' | 'video' | 'file' | null;
          likes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email?: string | null;
          text: string;
          media_url?: string | null;
          media_type?: 'image' | 'video' | 'file' | null;
          likes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_email?: string | null;
          text?: string;
          media_url?: string | null;
          media_type?: 'image' | 'video' | 'file' | null;
          likes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_likes: {
        Args: { row_id: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
