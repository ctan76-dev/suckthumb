'use client';

import { useMemo } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function Providers({ children }: { children: React.ReactNode }) {
  const supabaseClient = useMemo(
    () => createSupabaseBrowserClient(),
    []
  );

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
} 
