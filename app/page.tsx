'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Post = {
  id: string;
  text: string;
  created_at: string;
  likes: number;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const handleSubmit = async () => {
    if (!newPost.trim()) return;
    const { data, error } = await supabase.from('moments').insert([
      {
        id: uuidv4(),
        text: newPost,
        likes: 0,
      },
    ]);
    if (!error) {
      setNewPost('');
      fetchPosts();
    }
  };

  const handleLike = async (id: string) => {
    await supabase.rpc('increment_likes', { row_id: id });
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this moment?');
    if (confirmDelete) {
      await supabase.from('moments').delete().eq('id', id);
      fetchPosts();
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Suck Thumb? Share Lah.</h1>
        <p className="text-gray-600">
          Got rejected, missed a chance, kena scolded?
          <br />
          Don't just suck thumb. Bend it here — rant, laugh, or heal.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={handleSubmit} variant="default">
            🔵 Share Your Story
          </Button>
          <Button variant="secondary" onClick={fetchPosts}>
            🔵 Read Stories
          </Button>
        </div>
        <Textarea
          placeholder="What’s your moment?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Moments from Supabase</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500">No moments yet.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-xl p-4 bg-white shadow-sm space-y-2"
            >
              <p className="text-lg">{post.text}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => handleLike(post.id)} className="hover:text-red-500">
                    ❤️ {post.likes}
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="hover:text-red-500">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
