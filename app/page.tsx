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

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
  };

  const handleSubmit = async () => {
    if (!newPost.trim()) return;

    const { error } = await supabase.from('moments').insert({ text: newPost });

    if (error) {
      console.error('Error creating post:', error);
    } else {
      setNewPost('');
      fetchPosts();
    }
  };

  const handleLike = async (id: string) => {
    const { error } = await supabase.rpc('increment_likes', { row_id: id });
    if (error) {
      console.error('Error incrementing likes:', error);
    } else {
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm('Delete this post?');
    if (!confirmed) return;

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
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>

      <div className="mb-6">
        <textarea
          className="w-full border p-2 rounded mb-2"
          rows={3}
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind?"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleSubmit}
        >
          Post
        </button>
      </div>

      {posts.map((post) => (
        <div key={post.id} className="border p-4 mb-4 rounded shadow">
          <p className="mb-2">{post.text}</p>
          <p className="text-sm text-gray-500 mb-2">
            {moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}
          </p>
          <div className="flex items-center space-x-4">
            <button onClick={() => handleLike(post.id)} className="text-red-500">
              ❤️ {post.likes ?? 0}
            </button>
            <button onClick={() => handleDelete(post.id)} className="text-gray-500">
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}
