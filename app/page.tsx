// app/page.tsx

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to suckthumb.com</h1>
      <p className="text-lg text-gray-600 mb-6">
        Discover and share. Your ideas belong here.
      </p>
      <a
        href="/submit"
        className="px-6 py-3 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
      >
        Post Your Story
      </a>
    </main>
  );
}


