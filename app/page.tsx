'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Moment = {
  id: string;
  text: string;
  created_at: string;
  likes: number;
};

export default function HomePage() {
  const [posts, setPosts] = useState<Moment[]>([]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
  };

  const handleLike = async (id: string, currentLikes: number) => {
  const { error } = await supabase
    .from('moments')
    .update({ likes: currentLikes + 1 })
    .eq('id', id);

  if (error) {
    console.error('Error updating like:', error);
  } else {
    fetchPosts(); // Refresh the list after like
  }
};


  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Moments from Supabase</h1>
      {posts.length === 0 && <p>No moments yet.</p>}
      {posts.map((post) => (
        <div key={post.id} className="border p-4 rounded shadow">
          <p className="text-lg">{post.text || 'No text provided'}</p>
          <p className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleString()}
          </p>
          <button
  onClick={() => handleLike(post.id, post.likes)}
  className="text-blue-500 hover:text-blue-700"
>
  ❤️ {post.likes}
</button>

        </div>
      ))}
    </main>
  );
}
