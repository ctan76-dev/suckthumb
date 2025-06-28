// File: app/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash } from 'lucide-react';

type Post = {
  id: string;
  text: string;
  created_at: string;
  likes: number;
  user_id: string;
};

export default function HomePage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const userId = session?.user.id || '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');

  // Fetch all posts
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setPosts(data as Post[]);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Submit a new post (must be signed in)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('Please sign in to post.');
      return;
    }
    if (!newPost.trim()) return;
    const { error } = await supabase
      .from('moments')
      .insert([{ text: newPost.trim(), likes: 0, user_id: userId }]);
    if (error) console.error(error);
    else {
      setNewPost('');
      fetchPosts();
    }
  };

  // Increment like (must be signed in)
  const handleLike = async (id: string) => {
    if (!userId) {
      alert('Please sign in to like.');
      return;
    }
    const { error } = await supabase.rpc('increment_likes', { row_id: id });
    if (error) console.error(error);
    else
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      );
  };

  // Delete your own post
  const handleDelete = async (id: string, ownerId: string) => {
    if (ownerId !== userId) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    const { error } = await supabase.from('moments').delete().eq('id', id);
    if (error) console.error(error);
    else setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      {/* Hero */}
      <div className="bg-blue-50 p-4 rounded-xl shadow text-center border">
        <h1 className="text-xl font-semibold">Suck Thumb? Share It!</h1>
        <p className="text-gray-700 mt-2">
          Got rejected, missed a chance, kena scolded? Vent it here — rant,
          laugh, or heal. SHARE IT!
        </p>
      </div>

      {/* New post form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What happened today?"
          className="bg-white"
        />
        <Button type="submit" className="w-full">
          Post Your Story
        </Button>
      </form>

      {/* Posts feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-4 rounded-xl shadow border"
          >
            <p className="text-gray-800 whitespace-pre-line">{post.text}</p>
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>
                {moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}
              </span>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleLike(post.id)}
                >
                  ❤️ {post.likes}
                </Button>
                {post.user_id === userId && (
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(post.id, post.user_id)}
                  >
                    <Trash className="h-4 w-4 text-gray-500 hover:text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
