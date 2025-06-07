// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const [posts, setPosts] = useState<
    { id: string; title: string; content: string }[]
  >([]);

  useEffect(() => {
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Data:', data);
    console.log('Error:', error);

    if (error) console.error('Error fetching posts:', error);
    else setPosts(data || []);
  };

  fetchPosts();
}, []);


  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Latest Posts</h1>
      {posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="p-4 bg-gray-100 rounded shadow">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p>{post.content}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
