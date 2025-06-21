// File: app/layout.tsx

import './globals.css';
import { Providers } from '../lib/providers';

export const metadata = {
  title: 'SuckThumb',
  description: 'Share your moments and feel better.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />       {/* Next.js will inject app/head.tsx here */}
      <body>
        <Providers> {/* Wraps all pages in your Supabase context */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
