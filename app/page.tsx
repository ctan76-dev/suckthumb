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
    const { data } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    await supabase.from('moments').insert({ text: newPost, likes: 0 });
    setNewPost('');
    fetchPosts();
  };

  const handleLike = async (id: string, currentLikes: number) => {
    const { error } = await supabase
      .from('moments')
      .update({ likes: currentLikes + 1 })
      .eq('id', id);

    if (error) {
      console.error('Error updating like:', error);
      alert('Failed to update like!');
    } else {
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Delete this moment?');
    if (!confirm) return;

    await supabase.from('moments').delete().eq('id', id);
    fetchPosts();
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="flex-grow border border-gray-300 px-3 py-2 rounded"
          placeholder="Write a new moment..."
        />
        <button
          onClick={handlePost}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Post
        </button>
      </div>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="border p-4 rounded shadow flex flex-col gap-2"
          >
            <p className="text-lg">{post.text}</p>
            <div className="text-sm text-gray-500">
              {moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}
            </div>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => handleLike(post.id, post.likes)}
                className="flex items-center gap-2 text-red-500"
              >
                ❤️ {post.likes}
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-sm text-gray-600 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
