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

  useEffect(() => {
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

    fetchPosts();
  }, []);

  const handleLike = async (id: string) => {
    const { data, error } = await supabase
      .from('moments')
      .update({ likes: supabase.rpc('increment_like', { row_id: id }) }) // This will be fixed below
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error liking post:', error);
      return;
    }

    // Refetch posts to update UI
    const { data: updatedData } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });

    setPosts(updatedData || []);
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>
      {posts.map((post) => (
        <div
          key={post.id}
          className="border p-4 rounded-lg mb-4 shadow-sm bg-white"
        >
          <p className="text-lg">{post.text}</p>
          <p className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => handleLike(post.id)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Like
            </button>
            <span>{post.likes} likes</span>
          </div>
        </div>
      ))}
    </main>
  );
}
