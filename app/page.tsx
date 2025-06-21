// File: app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

// Mask email for privacy, e.g. "j…@domain.com"
function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.charAt(0)}…@${domain}`;
}

type Post = {
  id: string;
  user_id: string;
  user_email: string;
  text: string;
  media_url: string | null;
  created_at: string;
  post_likes: { user_id: string }[];
};

export default function HomePage() {
  const session = useSession();
  const supabase = useSupabaseClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Fetch moments + likes
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select(`
        *,
        post_likes ( user_id )
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading posts:', error);
    } else {
      setPosts(data as Post[]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [supabase]);

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  // Upload helper
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

  // Submit a new moment
  const handleSubmit = async () => {
    if (!newPost.trim() && !file) return;
    let mediaUrl: string | null = null;
    if (file) {
      mediaUrl = await uploadImage(file);
    }
    const { error } = await supabase.from('moments').insert([
      {
        text: newPost.trim(),
        media_url: mediaUrl,
        likes: 0,
        user_id: session?.user?.id,
        user_email: session?.user?.email ?? '',
      },
    ]);
    if (error) {
      console.error('Error adding post:', error);
    } else {
      setNewPost('');
      setFile(null);
      fetchPosts();
    }
  };

  // Like / Unlike
  const handleLike = async (postId: string) => {
    if (!session) return;
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: session.user.id });
    if (error && error.code !== '23505') {
      console.error('Like error:', error);
    }
    fetchPosts();
  };

  const handleUnlike = async (postId: string) => {
    if (!session) return;
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .match({ post_id: postId, user_id: session.user.id });
    if (error) console.error('Unlike error:', error);
    fetchPosts();
  };

  // Delete
  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this moment?')) return;
    await supabase.from('moments').delete().eq('id', postId);
    fetchPosts();
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 font-sans">
      {/* Logo & Auth */}
      <section className="bg-white p-6 rounded-xl shadow text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <img src="/logo.png" alt="SuckThumb Logo" className="h-16 w-auto" />
          <span className="text-2xl font-bold text-[#1414A0]">
            SuckThumb.com
          </span>
        </div>
        {!session ? (
          <p className="text-gray-600">
            Please{' '}
            <Link href="/signin" className="text-blue-600 hover:underline">
              sign in
            </Link>{' '}
            to post your story.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-gray-600">
            <span>
              Signed in as <strong>{maskEmail(session.user.email!)}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        )}
      </section>

      {/* Hero */}
      <section className="bg-white p-8 rounded-xl shadow border border-[#1414A0] text-center">
        <p className="text-[#1414A0]">
          Got rejected, missed a chance, kena scolded? Vent it here — rant, laugh,
          or heal. SHARE IT!
        </p>
      </section>

      {/* Post Form */}
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

      {/* Feed */}
      <section className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">
            No moments yet. Be the first to share!
          </p>
        ) : (
          posts.map((post) => {
            const likesCount = post.post_likes.length;
            const userHasLiked = session
              ? post.post_likes.some((l) => l.user_id === session.user.id)
              : false;

            return (
              <div
                key={post.id}
                className="bg-white p-4 rounded-lg shadow space-y-2"
              >
                <p className="text-xs text-gray-500">
                  Posted by {maskEmail(post.user_email)}
                </p>
                {post.media_url && (
                  <img
                    src={post.media_url}
                    alt=""
                    className="w-full object-cover rounded"
                  />
                )}
                <div className="prose">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {post.text}
                  </ReactMarkdown>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    {moment(post.created_at).format('DD/MM/YYYY HH:mm')}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant={userHasLiked ? 'solid' : 'ghost'}
                      onClick={() =>
                        userHasLiked
                          ? handleUnlike(post.id)
                          : handleLike(post.id)
                      }
                    >
                      ❤️ {likesCount}
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
            );
          })
        )}
      </section>
    </main>
  );
}
