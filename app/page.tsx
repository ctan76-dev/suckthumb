'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

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

    if (error) console.error('Error fetching posts:', error);
    else setPosts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const { error } = await supabase.from('moments').insert({
      text: newPost,
      likes: 0,
    });

    if (error) {
      console.error('Error inserting post:', error);
    } else {
      setNewPost('');
      fetchPosts();
    }
  };

  const handleLike = async (id: string, currentLikes: number) => {
  console.log('Liking post', id, 'Current likes:', currentLikes);

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
    const { error } = await supabase.from('moments').delete().eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
    } else {
      fetchPosts();
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          placeholder="Write a moment..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Post
        </button>
      </form>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="border border-gray-200 rounded p-4 shadow-sm"
          >
            <p className="text-lg mb-2">{post.text}</p>
            <p className="text-sm text-gray-500 mb-2">
              {new Date(post.created_at).toLocaleString()}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLike(post.id, post.likes)}
                className="text-red-500 hover:text-red-600"
              >
                ❤️ {post.likes}
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-sm text-gray-400 hover:text-red-600"
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
