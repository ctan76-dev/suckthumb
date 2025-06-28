// File: app/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import Link from 'next/link';

type Moment = {
  id: string;
  text: string;
  created_at: string;
  likes: number;
  user_id: string;
};

export default function HomePage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const userId = session?.user.id || null;

  const [moments, setMoments] = useState<Moment[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState('');

  // 1) Fetch moments and (if logged in) your likes
  useEffect(() => {
    fetchMoments();
    if (userId) fetchMyLikes();
  }, [userId]);

  async function fetchMoments() {
    const { data } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    setMoments(data || []);
  }

  async function fetchMyLikes() {
    const { data } = await supabase
      .from('likes')
      .select('moment_id')
      .eq('user_id', userId);
    setLikedIds(new Set(data?.map(l => l.moment_id)));
  }

  // 2) Toggle like / unlike
  async function toggleLike(id: string) {
    if (!userId) {
      alert('Please sign in to like.');
      return;
    }
    if (likedIds.has(id)) {
      // unlike
      await supabase
        .from('likes')
        .delete()
        .eq('moment_id', id)
        .eq('user_id', userId);
      await supabase
        .from('moments')
        .update({ likes: moments.find(m => m.id === id)!.likes - 1 })
        .eq('id', id);
      likedIds.delete(id);
    } else {
      // like
      await supabase
        .from('likes')
        .insert([{ user_id: userId, moment_id: id }]);
      await supabase
        .from('moments')
        .update({ likes: moments.find(m => m.id === id)!.likes + 1 })
        .eq('id', id);
      likedIds.add(id);
    }
    setLikedIds(new Set(likedIds));
    fetchMoments();
  }

  // 3) Delete only your own post
  async function handleDelete(id: string, ownerId: string) {
    if (ownerId !== userId) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    await supabase.from('moments').delete().eq('id', id);
    fetchMoments();
  }

  // 4) Submit new moment, capturing user_id
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) {
      alert('Please sign in to post.');
      return;
    }
    if (!draft.trim()) return;
    await supabase.from('moments')
      .insert([{ text: draft.trim(), likes: 0, user_id: userId }]);
    setDraft('');
    fetchMoments();
  }

  // If not signed in, show the “please sign in” card
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-sm">
          <p className="mb-2">Please{' '}
            <Link href="/signin" className="text-blue-600 hover:underline">
              Sign In
            </Link>{' '}
            to post your story.
          </p>
          <p className="text-sm text-gray-600">
            New user?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Main feed for signed-in users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero & new post form */}
      <section className="bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4">Got rejected, missed a chance, kena scolded?</h1>
        <p className="text-gray-700 mb-4">
          Vent it here — rant, laugh, or heal. SHARE IT!
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="What happened today?"
            className="w-full p-3 border rounded resize-none h-24"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Post Your Story
          </button>
        </form>
      </section>

      {/* Stories feed */}
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h2 className="text-lg font-medium border-b pb-2">STORIES</h2>
        {moments.map(m => (
          <article
            key={m.id}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <p className="whitespace-pre-line">{m.text}</p>
            <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
              <span>{new Date(m.created_at).toLocaleString()}</span>
              <div className="flex items-center space-x-4">
                <button onClick={() => toggleLike(m.id)}>
                  {likedIds.has(m.id) ? '💔' : '❤️'} {m.likes}
                </button>
                {m.user_id === userId && (
                  <button onClick={() => handleDelete(m.id, m.user_id)}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
