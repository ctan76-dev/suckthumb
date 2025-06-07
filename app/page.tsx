'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';

type Moment = {
  id: string;
  text: string;
  created_at: string;
};

export default function HomePage() {
  const [posts, setPosts] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts');
      } else {
        // Filter out posts with no text or only whitespace
        const filtered = (data || []).filter(
          (post) => post && post.text?.trim()
        );
        setPosts(filtered);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="text-gray-500">No posts yet.</p>
      )}

      <ul className="space-y-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="p-4 bg-white shadow rounded border border-gray-200"
          >
            <p>{post.text}</p>
            <small className="text-gray-500">
              {new Date(post.created_at).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </main>
  );
}
