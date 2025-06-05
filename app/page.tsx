import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Inspire08</h1>
      <p className="text-lg text-gray-600 mb-8">
        Everyone has a story. Share it. Feel better. Help someone else do the same.
      </p>
      <Link
        href="/submit"
        className="px-6 py-3 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
      >
        Post Your Story
      </Link>
    </main>
  );
}
