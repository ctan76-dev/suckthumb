// For src/app/page.tsx or pages/index.tsx

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Got a Suck Thumb Moment?
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Share it. Feel better. Help someone else do the same.
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
