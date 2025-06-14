// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // 1) Load existing posts
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      else setPosts(data as Post[]);
    })();
  }, []);

  // 2) Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFile(e.target.files?.[0] ?? null);

  // 3) Upload file and return its public URL
  const uploadImage = async (f: File) => {
    const filePath = `${Date.now()}_${f.name}`;
    const { data, error } = await supabase.storage
      .from('stories')
      .upload(filePath, f);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    return supabase.storage
      .from('stories')
      .getPublicUrl(data.path).publicUrl;
  };

  // 4) Submit new moment
  const handleSubmit = async () => {
    if (!newPost.trim() && !file) return;
    let mediaUrl: string | null = null;
    if (file) mediaUrl = await uploadImage(file);

    const { error } = await supabase.from('moments').insert([
      { text: newPost.trim(), media_url: mediaUrl, likes: 0 }
    ]);
    if (error) console.error(error);
    else {
      setNewPost('');
      setFile(null);
      // refresh list
      const { data } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPosts(data as Post[]);
    }
  };

  // 5) Like & delete handlers (unchanged)
  const handleLike = async (id: string) => {
    await supabase.rpc('increment_likes', { row_id: id });
    setPosts(p =>
      p.map(x => (x.id === id ? { ...x, likes: x.likes + 1 } : x))
    );
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this moment?')) return;
    await supabase.from('moments').delete().eq('id', id);
    setPosts(p => p.filter(x => x.id !== id));
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Hero */}
      <section className="bg-white p-8 rounded shadow border border-[#1414A0] text-center space-y-4">
        <h1 className="text-3xl font-bold text-[#1414A0]">Suck Thumb? Share It!</h1>
        <p className="text-[#1414A0]">Got rejected… rant, laugh, or heal.</p>
      </section>

      {/* Form */}
      <section className="bg-white p-6 rounded shadow space-y-4">
        <textarea
          className="w-full p-2 border rounded"
          rows={4}
          placeholder="What happened today?"
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <Button onClick={handleSubmit} className="w-full">
          Post Your Story
        </Button>
      </section>

      {/* Posts */}
      <section className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-4 rounded shadow space-y-2">
            {post.media_url && (
              <img
                src={post.media_url}
                alt=""
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
        ))}
      </section>
    </main>
  );
}
