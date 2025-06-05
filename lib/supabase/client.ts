// lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../database.types'; // make sure this path is correct

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
