// File: app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

type Post = {
  id: string;
  user_id: string;
  user_email: string;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFile(e.target.files?.[0] ?? null);

  const uploadImage = async (f: File) => {
    const path = `${Date.now()}_${f.name}`;
    const { data: uploadData, error } = await supabase.storage
      .from('stories')
      .upload(path, f);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('stories').getPublicUrl(uploadData.path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!newPost.trim() && !file) return;
    let mediaUrl: string | null = null;
    if (file) mediaUrl = await uploadImage(file);

    const { error } = await supabase
      .from('moments')
      .insert([
        {
          text: newPost.trim(),
          media_url: mediaUrl,
          likes: 0,
          user_id: session?.user?.id,
          user_email: session?.user?.email || '',
        },
      ]);
    if (error) console.error('Insert error:', error);
    else {
      setNewPost('');
      setFile(null);
      const { data } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPosts(data as Post[]);
    }
  };

  const handleLike = async (id: string) => {
    await supabase.rpc('increment_likes', { row_id: id });
    setPosts((p) =>
      p.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m))
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this moment?')) return;
    await supabase.from('moments').delete().eq('id', id);
    setPosts((p) => p.filter((m) => m.id !== id));
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 font-sans">
      {/* Hero */}
      <section className="bg-white p-8 rounded-xl shadow space-y-4 border border-[#1414A0] text-center">
        <h1 className="text-3xl font-bold text-[#1414A0]">
          Suck Thumb? Share It!
        </h1>
        <p className="text-[#1414A0]">
          Got rejected, missed a chance, kena scolded? Vent it here—rant, laugh, or heal.
        </p>
      </section>

      {/* Form (signed-in only) */}
      {session && (
        <section className="bg-white p-6 rounded-lg shadow space-y-4">
          <textarea
            rows={4}
            placeholder="What happened today?"
            className="w-full p-2 border rounded"
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
      )}

      {/* Moments Feed */}
      <section className="space-y-6">
        {posts.length === 0 && (
          <p className="text-center text-gray-500">
            No moments yet. Be the first to share!
          </p>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-4 rounded-lg shadow space-y-2"
          >
            <p className="text-xs text-gray-500">
              Posted by {post.user_email}
            </p>
            {post.media_url && (
              <img
                src={post.media_url}
                alt=""
                className="w-full object-cover rounded"
              />
            )}
            <p className="text-gray-800">{post.text}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{moment(post.created_at).format('DD/MM/YYYY HH:mm')}</span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => handleLike(post.id)}>
                  ❤️ {post.likes}
                </Button>
                {session?.user?.id === post.user_id && (
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
