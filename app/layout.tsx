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
      <head /> {/* Next.js injects app/head.tsx here */}
      <body className="overflow-auto">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
