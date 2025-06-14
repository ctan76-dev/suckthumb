// app/layout.tsx
import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Suck Thumb',
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
      {/* ⬇️ Changed bg-white instead of bg-blue-50 */}
      <body className="bg-white text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
