'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import moment from 'moment';

type Post = {
  id: string;
  text: string;
  created_at: string;
  likes: number;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async () => {
    if (!newPost.trim()) return;

    const { error } = await supabase.from('moments').insert([{ text: newPost }]);
    if (!error) {
      setNewPost('');
      fetchPosts();
    }
  };

  const handleLike = async (id: string) => {
    await supabase.rpc('increment_likes', { row_id: id });
    fetchPosts(); // Refresh after liking
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    await supabase.from('moments').delete().eq('id', id);
    fetchPosts(); // Refresh after deleting
  };

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Moments from Supabase</h1>

      <div className="flex space-x-2">
        <input
          type="text"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Write your moment..."
          className="flex-1 border px-3 py-2 rounded"
        />
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
          Post
        </button>
      </div>

      {posts.map((post) => (
        <div key={post.id} className="border rounded p-4 shadow">
          <p className="text-lg">{post.text}</p>
          <p className="text-gray-400 text-xs mt-1">
            {moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}
          </p>

          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={() => handleLike(post.id)}
              className="flex items-center space-x-1 text-red-500"
            >
              ❤️ <span>{post.likes ?? 0}</span>
            </button>
            <button
              onClick={() => handleDelete(post.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}
