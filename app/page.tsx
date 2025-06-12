// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

  // Fetch latest moments
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error('Error loading posts:', error);
      else setPosts(data as Post[]);
    };
    load();
  }, []);

  // Handle image selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  // Upload to Supabase Storage
  const uploadImage = async (file: File) => {
    const filePath = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('stories')
      .upload(filePath, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { publicUrl } = supabase.storage
      .from('stories')
      .getPublicUrl(data.path);
    return publicUrl;
  };

  // Add a new moment
  const handleSubmit = async () => {
    if (!newPost.trim() && !file) return;

    let mediaUrl: string | null = null;
    if (file) {
      mediaUrl = await uploadImage(file);
    }

    const { error } = await supabase
      .from('moments')
      .insert([{ text: newPost.trim(), media_url: mediaUrl, likes: 0 }]);
    if (error) console.error('Error adding post:', error);
    else {
      setNewPost('');
      setFile(null);
      // refresh list
      const { data } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });
      setPosts(data as Post[]);
    }
  };

  // Like a moment
  const handleLike = async (id: string) => {
    const { error } = await supabase.rpc('increment_likes', { row_id: id });
    if (error) console.error('Error liking post:', error);
    else {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      );
    }
  };

  // Delete a moment
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this moment?')) return;
    const { error } = await supabase.from('moments').delete().eq('id', id);
    if (error) console.error('Error deleting post:', error);
    else setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 font-sans">
      {/* Hero */}
      <section className="bg-white p-8 rounded-xl shadow border border-[#1414A0] text-center space-y-4">
        <h1 className="text-4xl font-bold text-[#1414A0]">Suck Thumb? Share It!</h1>
        <p className="text-lg text-[#1414A0]">Got rejected, missed a chance, kena scolded?</p>
        <p className="text-base text-[#1414A0]">Don’t just suck thumb. Vent it here — rant, laugh, or heal.</p>
      </section>

      {/* New Moment Form */}
      <section className="space-y-3">
        <Textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What happened today?"
          className="w-full"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500"
        />
        <Button onClick={handleSubmit} className="w-full">
          Post Your Story
        </Button>
      </section>

      {/* Moments List */}
      <section className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No moments yet. Be the first to share!</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{ backgroundColor: '#ffffff' }}
              className="border rounded-lg p-4 space-y-4"
            >
              {post.media_url && (
                <img
                  src={post.media_url}
                  alt="Uploaded"
                  className="w-full max-h-60 object-cover rounded"
                />
              )}
              <p className="text-gray-800">{post.text}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}</span>
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => handleLike(post.id)}>
                    ❤️ {post.likes}
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(post.id)}>
                    <Trash className="h-4 w-4" />
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
