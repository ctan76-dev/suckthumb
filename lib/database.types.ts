export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      moments: {
        Row: {
          id: number;
          content: string;
          created_at: string;
        };
        Insert: {
          content: string;
        };
        Update: {
          content?: string;
        };
      };
    };
  };
}
