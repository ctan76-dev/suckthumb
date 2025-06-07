'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

type Post = {
  id: string;
  text: string;
  created_at: string;
  likes: number;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');

  // Load all posts from Supabase
  useEffect(() => {
    const loadPosts = async () => {
      const { data } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setPosts(data);
      }
    };

    loadPosts();
  }, []);

  // Add new post
  const handleAdd = async () => {
    if (!newPost.trim()) return;

    const { data, error } = await supabase
      .from('moments')
      .insert([{ id: uuidv4(), text: newPost }])
      .select();

    if (data) {
      setPosts((prev) => [data[0], ...prev]);
      setNewPost('');
    }
  };

  // Increment likes via RPC
  const handleLike = async (id: string) => {
    const { error } = await supabase.rpc('increment_likes', { row_id: id });
    if (!error) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id ? { ...post, likes: post.likes + 1 } : post
        )
      );
    }
  };

  // Delete post
  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this post?');
    if (!confirm) return;

    const { error } = await supabase.from('moments').delete().eq('id', id);
    if (!error) {
      setPosts((prev) => prev.filter((post) => post.id !== id));
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share your moment..."
          className="flex-1 border p-2 rounded"
        />
        <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded">
          Post
        </button>
      </div>

      {posts.map((post) => (
        <div
          key={post.id}
          className="border rounded p-4 mb-4 shadow-sm bg-white"
        >
          <p className="text-gray-800">{post.text}</p>
          <p className="text-sm text-gray-500 mt-2">
            {moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleLike(post.id)}
              className="text-red-500 text-xl"
              title="Like"
            >
              ❤️ {post.likes}
            </button>
            <button
              onClick={() => handleDelete(post.id)}
              className="text-gray-500 text-sm"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}
