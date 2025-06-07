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

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setPosts(data as Post[]);
    if (error) console.error('Fetch error:', error.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    } else {
      console.error('Insert error:', error.message);
    }
  }

  async function handleLike(id: string) {
    const { error } = await supabase.rpc('increment_likes', { row_id: id });
    if (!error) fetchPosts();
    else console.error('Like error:', error.message);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this moment?')) return;
    const { error } = await supabase.from('moments').delete().eq('id', id);
    if (!error) fetchPosts();
    else console.error('Delete error:', error.message);
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">

      {/* Hero Section */}
      <div className="bg-blue-50 p-6 rounded-xl shadow mb-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-blue-800">Suck Thumb? Share Lah.</h1>
        <p className="text-gray-700">
          Got rejected, missed a chance, kena scolded? <br />
          Don't just suck thumb. Bend it here — rant, laugh, or heal.
        </p>
        <div className="flex justify-center gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-2 rounded-full shadow">
            🔵 Share Your Story
          </Button>
          <Button variant="outline" className="text-blue-600 border-blue-600 text-lg px-6 py-2 rounded-full shadow">
            🔵 Read Stories
          </Button>
        </div>
      </div>

      {/* New Post Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="What’s on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>

      {/* Posts List */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white p-4 rounded-xl shadow space-y-2"
            >
              <p className="text-gray-900 whitespace-pre-line">{post.text}</p>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>{moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleLike(post.id)} className="hover:text-red-500">
                    ❤️ {post.likes}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No moments yet. Be the first to share!</p>
      )}
    </main>
  );
}
