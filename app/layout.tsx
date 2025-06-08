'use client';

import './globals.css';             // ← import your Tailwind globals
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

export const metadata = {
  title: 'Suck Thumb',
  description: 'Share your moments and feel better.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // initialize supabase client
  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    })
  );

  return (
    <html lang="en">
      <head>
        {/* you can add more <meta> or <link> tags here */}
      </head>
      <body className="bg-gray-50 text-gray-900">
        <SessionContextProvider supabaseClient={supabaseClient}>
          {children}
        </SessionContextProvider>
      </body>
    </html>
  );
}
