export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
-     <body>
+     <body className="overflow-auto">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
