// File: app/layout.tsx
'use client';

import './globals.css';                // your Tailwind styles
import { Providers } from '../lib/providers';  // ← go up one level, into lib/

export const metadata = { /* … */ };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
