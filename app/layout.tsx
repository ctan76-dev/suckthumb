// File: app/layout.tsx
-import './globals.css';
-import { Providers } from '@/lib/providers';
+import './globals.css';
+import { Providers } from '../lib/providers';  // <-- relative path up to root/lib

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
      <head />
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
