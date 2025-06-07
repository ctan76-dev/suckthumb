'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Moment {
  id: string;
  text: string;
  created_at: string;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Moment[]>([]);
  const [newMoment, setNewMoment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching posts:', error);
    else setPosts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMoment.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('moments').insert({ text: newMoment });
    if (error) console.error('Insert error:', error);
    setNewMoment('');
    await fetchPosts();
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newMoment}
          onChange={(e) => setNewMoment(e.target.value)}
          placeholder="Share your moment..."
          className="flex-1 p-2 border rounded"
        />
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>

      {posts.length === 0 ? (
        <p>No moments yet.</p>
      ) : (
        <ul className="space-y-4">
  {posts.map((post) => (
    <li key={post.id} className="border p-4 rounded">
      <p>{post.text}</p>
      <p className="text-sm text-gray-500">
        {new Date(post.created_at).toLocaleString()}
      </p>
      <button
        onClick={async () => {
          const { error } = await supabase.from('moments').delete().eq('id', post.id);
          if (error) {
            console.error('Delete error:', error);
          } else {
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          }
        }}
        className="mt-2 text-red-500 text-sm hover:underline"
      >
        Delete
      </button>
    </li>
  ))}
</ul>

      )}
    </main>
  );
}

