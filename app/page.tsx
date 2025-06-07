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

    if (error) {
      console.error('Error fetching posts:', error.message);
    } else {
      setPosts(data as Post[]);
    }
  };

  const addPost = async () => {
    if (!newPost.trim()) return;

    const { error } = await supabase.from('moments').insert([{ text: newPost }]);
    if (error) {
      console.error('Error adding post:', error.message);
    } else {
      setNewPost('');
      fetchPosts();
    }
  };

  const likePost = async (id: string) => {
    const { error } = await supabase.rpc('increment_likes', { row_id: id });
    if (error) {
      console.error('Error liking post:', error.message);
    } else {
      fetchPosts();
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase.from('moments').delete().eq('id', id);
    if (error) {
      console.error('Error deleting post:', error.message);
    } else {
      fetchPosts();
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <main className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Moments from Supabase</h1>

      <div className="flex gap-2">
        <input
          className="flex-1 border px-2 py-1"
          placeholder="Write your moment..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-1" onClick={addPost}>
          Post
        </button>
      </div>

      {posts.length === 0 && <p className="text-gray-500">No posts yet.</p>}

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} className="border p-3 rounded shadow-sm">
            <p className="text-lg">{post.text}</p>
            <p className="text-sm text-gray-500">
              {new Intl.DateTimeFormat('default', {
                dateStyle: 'short',
                timeStyle: 'medium',
              }).format(new Date(post.created_at))}
            </p>
            <div className="mt-2 flex gap-4 items-center">
              <button onClick={() => likePost(post.id)}>❤️ {post.likes}</button>
              <button onClick={() => deletePost(post.id)} className="text-red-500">
                🗑️ Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
