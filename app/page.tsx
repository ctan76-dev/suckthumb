'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import moment from 'moment';
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

  // Load posts
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading posts:', error);
    } else {
      setPosts(data as Post[]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Add new post
  const handleSubmit = async () => {
    if (!newPost.trim()) return;

    const { error } = await supabase.from('moments').insert([
      {
        text: newPost.trim(),
        likes: 0,
      },
    ]);

    if (error) {
      console.error('Error adding post:', error);
    } else {
      setNewPost('');
      fetchPosts();
    }
  };

  // Like a post
  const handleLike = async (id: string) => {
    const { error } = await supabase.rpc('increment_likes', { row_id: id });

    if (error) {
      console.error('Error liking post:', error);
      return;
    }

    setPosts(prev =>
      prev.map(post =>
        post.id === id ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  // Delete a post
  const handleDelete = async (id: string) => {
    const confirmed = confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    const { error } = await supabase.from('moments').delete().eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return;
    }

    setPosts(prev => prev.filter(post => post.id !== id));
  };

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <div className="bg-blue-50 p-4 rounded-xl shadow text-center">
        <h1 className="text-xl font-semibold">Suck Thumb? Share Lah.</h1>
        <p className="text-gray-700 mt-2">
          Got rejected, missed a chance, kena scolded? Don&apos;t just suck thumb.
          Bend it here — rant, laugh, or heal.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Button onClick={handleSubmit}>🔵 Share Your Story</Button>
          <Button variant="secondary" onClick={fetchPosts}>🔵 Read Stories</Button>
        </div>
      </div>

      <Textarea
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
        placeholder="What happened today?"
      />

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-4 rounded-xl shadow border"
          >
            <p className="text-gray-800 whitespace-pre-line">{post.text}</p>
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>{moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}</span>
              <div>
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleLike(post.id)}
                >
                  ❤️ {post.likes}
                </Button>
                <Button
                  variant="destructive"
                  className="ml-2"
                  onClick={() => handleDelete(post.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
