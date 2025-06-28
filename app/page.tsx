// File: app/page.tsx
'use client';

import Link from 'next/link';
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

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `*@@${domain}`;
  }
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

export default function HomePage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const userId = session?.user.id || '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // 1️⃣ Load posts and, if logged in, your liked post IDs
  useEffect(() => {
    fetchPosts();
    if (userId) fetchMyLikes();
  }, [userId]);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setPosts(data as Post[]);
  }

  async function fetchMyLikes() {
    const { data, error } = await supabase
      .from('likes')
      .select('moment_id')
      .eq('user_id', userId);
    if (error) console.error(error);
    else setLikedIds(new Set(data.map((r: any) => r.moment_id)));
  }

  // 2️⃣ Toggle like/unlike
  async function toggleLike(postId: string) {
    if (!userId) {
      alert('Please sign in to like.');
      return;
    }

    if (likedIds.has(postId)) {
      // unlike
      await supabase
        .from('likes')
        .delete()
        .eq('moment_id', postId)
        .eq('user_id', userId);
      await supabase
        .from('moments')
        .update({ likes: posts.find(p => p.id === postId)!.likes - 1 })
        .eq('id', postId);
      likedIds.delete(postId);
    } else {
      // like
      await supabase
        .from('likes')
        .insert([{ user_id: userId, moment_id: postId }]);
      await supabase
        .from('moments')
        .update({ likes: posts.find(p => p.id === postId)!.likes + 1 })
        .eq('id', postId);
      likedIds.add(postId);
    }

    setLikedIds(new Set(likedIds));
    fetchPosts();
  }

  // 3️⃣ Delete your own post
  async function handleDelete(postId: string, ownerId: string) {
    if (ownerId !== userId) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    const { error } = await supabase.from('moments').delete().eq('id', postId);
    if (error) console.error(error);
    else setPosts(p => p.filter(x => x.id !== postId));
  }

  // 4️⃣ Submit a new post
  async function handleSubmit(e: FormEvent) {
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
  }

  return (
    <>
      {/* ─── FULL-WIDTH BANNER ───────────────────────────────── */}
      <nav className="w-full flex items-center justify-between bg-white border-b shadow px-6 py-4">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="SuckThumb.com" className="h-8 w-8" />
          <span className="text-xl font-bold text-[#1414A0]">
            SuckThumb.com
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <span className="text-gray-700">
                Signed in as <strong>{maskEmail(session.user.email)}</strong>
              </span>
              <button
                onClick={async () => { await supabase.auth.signOut(); }}
                className="text-red-600 hover:underline"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="text-[#1414A0] hover:underline">
                Sign In
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
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
            onChange={e => setNewPost(e.target.value)}
            placeholder="What happened today?"
            className="bg-white"
          />
          <Button type="submit" className="w-full">
            Post Your Story
          </Button>
        </form>

        {/* Posts feed */}
        <div className="space-y-4">
          {posts.map(post => (
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
                    className={likedIds.has(post.id) ? 'text-red-500' : 'text-gray-500'}
                    onClick={() => toggleLike(post.id)}
                  >
                    {likedIds.has(post.id) ? '💔' : '❤️'} {post.likes}
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
    </>
  );
}
