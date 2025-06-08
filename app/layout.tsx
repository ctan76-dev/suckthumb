// app/layout.tsx

import './globals.css';              // ← correct relative import

import { Providers } from './providers';

export const metadata = {
  title: 'Suck Thumb',
  description: 'Share your moments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
