// File: app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

type Post = {
  id: string;
  text: string;
  created_at: string;
  likes: number;
};

export default function HomePage() {
  const supabase = useSupabaseClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState('');

  // load posts
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setPosts(data as Post[]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const { error } = await supabase.from('moments').insert([{ text: draft.trim(), likes: 0 }]);
    if (!error) {
      setDraft('');
      fetchPosts();
    }
  }

  async function handleLike(id: string) {
    await supabase.rpc('increment_likes', { row_id: id });
    setPosts((p) => p.map(x => x.id === id ? { ...x, likes: x.likes + 1 } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm('Really delete this?')) return;
    await supabase.from('moments').delete().eq('id', id);
    setPosts(p => p.filter(x => x.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* NAV */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Image src="/logo.png" alt="SuckThumb" width={32} height={32} />
          <span className="text-xl font-bold">SuckThumb</span>
        </div>
        <nav className="space-x-4">
          <Link href="/signin" className="hover:underline">Sign In</Link>
          <Link href="/signup" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            Sign Up
          </Link>
        </nav>
      </header>

      {/* HERO + POST FORM */}
      <section className="max-w-3xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">
          Got rejected, missed a chance, kena scolded?
        </h2>
        <p className="text-center">
          Vent it here — rant, laugh, or heal. <strong>SHARE IT!</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Post your suck‐thumb moment…"
            className="w-full h-32 p-4 border rounded-lg resize-none focus:outline-blue-500"
          />
          <div className="mt-3 text-right">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Share it!
            </button>
          </div>
        </form>
      </section>

      {/* STORIES FEED */}
      <main className="max-w-3xl mx-auto p-6 space-y-8">
        <h3 className="text-lg font-medium border-b pb-2">STORIES</h3>
        {posts.map(post => (
          <article key={post.id} className="p-4 bg-white rounded-lg shadow-sm space-y-2">
            <p className="whitespace-pre-wrap">{post.text}</p>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{new Date(post.created_at).toLocaleString()}</span>
              <div className="flex items-center space-x-4">
                <button onClick={() => handleLike(post.id)} className="hover:text-red-500">
                  ❤️ {post.likes}
                </button>
                <button onClick={() => handleDelete(post.id)} className="hover:text-gray-800">
                  🗑️
                </button>
              </div>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
