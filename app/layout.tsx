// File: app/layout.tsx
import './globals.css';              // ← ensure your Tailwind CSS is loaded
import { Providers } from '@/lib/providers'; // or adjust the path if your providers.tsx lives elsewhere

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
      <head />                        {/* Next will inject your app/head.tsx here */}
      <body>
        <Providers>                  {/* Supabase Auth context */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
