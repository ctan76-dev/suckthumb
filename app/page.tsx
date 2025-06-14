// File: app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

type Post = {
  id: string;
  text: string;
  media_url: string | null;
  created_at: string;
  likes: number;
};

export default function HomePage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // 1️⃣ Load posts
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      else setPosts(data as Post[]);
    })();
  }, [supabase]);

  // 2️⃣ Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  // 3️⃣ Upload helper
  const uploadImage = async (f: File) => {
    const path = `${Date.now()}_${f.name}`;
    const { data, error } = await supabase.storage
      .from('stories')
      .upload(path, f);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    return supabase.storage.from('stories').getPublicUrl(data.path).publicUrl;
  };

  // 4️⃣ Submit a new moment
  const handleSubmit = async () => {
    if (!newPost.trim() && !file) return;
    let mediaUrl: string | null = null;
    if (file) mediaUrl = await uploadImage(file);

    const { error } = await supabase.from('moments').insert([
      { text: newPost.trim(), media_url: mediaUrl, likes: 0 },
    ]);
    if (error) console.error(error);
    else {
      setNewPost('');
      setFile(null);
      // reload
      const { data } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPosts(data as Post[]);
    }
  };

  // 5️⃣ Like & Delete
  const handleLike = async (id: string) => {
    await supabase.rpc('increment_likes', { row_id: id });
    setPosts((p) =>
      p.map((x) => (x.id === id ? { ...x, likes: x.likes + 1 } : x))
    );
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this moment?')) return;
    await supabase.from('moments').delete().eq('id', id);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  // 6️⃣ Sign-out helper
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // If not signed in, show sign-in prompt
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="mb-4">You must be signed in to post.</p>
          <Link href="/signin" replace>
            <Button>Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Authenticated view ---
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Sign Out */}
      <div className="text-right">
        <Button variant="link" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      {/* Hero */}
      <section className="bg-white p-8 rounded shadow border border-[#1414A0] text-center space-y-4">
        <h1 className="text-3xl font-bold text-[#1414A0]">Suck Thumb? Share It!</h1>
        <p className="text-[#1414A0]">Got rejected, rant, laugh, or heal.</p>
      </section>

      {/* New Moment Form */}
      <section className="bg-white p-6 rounded shadow space-y-4">
        <textarea
          className="w-full p-2 border rounded"
          rows={4}
          placeholder="What happened today?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="block sm:hidden">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" className="w-full">
              Upload Image
            </Button>
          </label>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            Post Your Story
          </Button>
        </div>
      </section>

      {/* Moments List */}
      <section className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">
            No moments yet. Be the first to share!
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white p-4 rounded shadow space-y-2"
            >
              {post.media_url && (
                <img
                  src={post.media_url}
                  alt="User upload"
                  className="w-full object-cover rounded"
                />
              )}
              <p>{post.text}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{moment(post.created_at).format('DD/MM/YYYY HH:mm')}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => handleLike(post.id)}>
                    ❤️ {post.likes}
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(post.id)}>
                    <Trash />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
