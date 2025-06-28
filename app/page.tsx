// File: app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
};

export default function HomePage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');

  // Load posts
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error loading posts:', error);
    else setPosts(data as Post[]);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Insert a new post (only if signed in)
  const handleSubmit = async () => {
    if (!newPost.trim() || !session) return;
    const { error } = await supabase
      .from('moments')
      .insert([{ text: newPost.trim(), likes: 0 }]);
    if (error) console.error('Error adding post:', error);
    else {
      setNewPost('');
      fetchPosts();
    }
  };

  // Like a post
  const handleLike = async (id: string) => {
    const { error } = await supabase.rpc('increment_likes', { row_id: id });
    if (error) console.error('Error liking post:', error);
    else {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      );
    }
  };

  // Delete a post
  const handleDelete = async (id: string) => {
    if (!session || !confirm('Delete this post?')) return;
    const { error } = await supabase.from('moments').delete().eq('id', id);
    if (error) console.error('Delete error:', error);
    else setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      {/* ——— Gate the form ——— */}
      {session ? (
        <>
          <div className="bg-blue-50 p-4 rounded-xl shadow text-center">
            <h1 className="text-xl font-semibold text-[#1414A0]">
              Suck Thumb? Share It!
            </h1>
            <p className="text-gray-700 mt-2">
              Got rejected, missed a chance, kena scolded? Vent it here — rant,
              laugh, or heal. SHARE IT!
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Button onClick={handleSubmit}>🔵 Share Your Story</Button>
              <Button variant="secondary" onClick={fetchPosts}>
                🔵 Read Stories
              </Button>
            </div>
          </div>

          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What happened today?"
            className="bg-white"
          />
        </>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow text-center space-y-3">
          <p className="text-lg text-gray-700">
            Please{' '}
            <Link href="/signin" className="text-blue-600 hover:underline">
              Sign In
            </Link>{' '}
            to post your story.
          </p>
          <p className="text-sm text-gray-600">
            New user?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      )}

      {/* ——— Always show the feed ——— */}
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleLike(post.id)}
                >
                  ❤️ {post.likes}
                </Button>
                {session && (
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash className="h-4 w-4 text-gray-500 hover:text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-center text-gray-500">
            No moments yet. Be the first to share!
          </p>
        )}
      </div>
    </main>
  );
}
