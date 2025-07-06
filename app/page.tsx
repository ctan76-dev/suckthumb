'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash, User as UserIcon } from 'lucide-react';

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
  const userId = session?.user.id;

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Load posts + current user's likes
  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (userId) fetchMyLikes();
  }, [userId]);

  // Fetch all posts
  async function fetchPosts() {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error loading posts:', error);
    else setPosts(data as Post[]);
  }

  // Fetch which posts *this* user has liked
  async function fetchMyLikes() {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId);
    if (error) console.error('Error loading likes:', error);
    else setLikedIds(new Set(data.map((r: any) => r.post_id)));
  }

  // Toggle like / unlike via your RPCs
  async function toggleLike(postId: string) {
    if (!userId) {
      alert('Please sign in to like.');
      return;
    }

    const isLiked = likedIds.has(postId);
    const rpcName = isLiked ? 'decrement_like' : 'increment_like';

    const { error } = await supabase
      .rpc(rpcName, { moment_id: postId });

    if (error) {
      console.error('RPC error:', error.message);
    }

    // Refresh both your like-list and the posts count
    await fetchMyLikes();
    await fetchPosts();
  }

  // Delete your own post
  async function handleDelete(postId: string, ownerId: string) {
    if (ownerId !== userId) return;
    if (!confirm('Delete this post?')) return;

    const { error } = await supabase
      .from('moments')
      .delete()
      .eq('id', postId);

    if (error) console.error('Error deleting post:', error);
    else setPosts(ps => ps.filter(p => p.id !== postId));
  }

  // Submit a new post
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) {
      alert('Please sign in to post.');
      return;
    }
    const text = newPost.trim();
    if (!text) return;

    const { error } = await supabase
      .from('moments')
      .insert({ text, likes: 0, user_id: userId });

    if (error) {
      console.error('Error adding post:', error);
    } else {
      setNewPost('');
      fetchPosts();
    }
  }

  return (
    <>
      {/* BANNER */}
      <nav className="w-full flex items-center justify-between bg-white border-b px-6 py-4 shadow">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="SuckThumb" className="h-8 w-8" />
          <span className="text-xl font-bold text-[#1414A0]">SuckThumb</span>
        </div>
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              {session.user.user_metadata?.avatar_url ? (
                <img
                  src={session.user.user_metadata.avatar_url}
                  alt="Your avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-8 w-8 text-gray-500" />
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="ml-3 text-red-600 hover:underline text-sm"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="text-[#1414A0] hover:underline text-sm">
                Sign In
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-xl mx-auto p-4 space-y-6">
        {/* HERO */}
        <div className="bg-blue-800 p-6 rounded-xl shadow text-center border border-blue-800">
          <p className="text-3xl font-bold text-white">
            Got rejected, missed chance, kena scolded?
          </p>
          <p className="text-xl text-white mt-3">
            Vent it here, rant, laugh or heal. Share it!
          </p>
        </div>

        {/* NEW POST */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            rows={5}
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="What happened today?"
            className="
              w-full bg-white border-2 border-[#1414A0]
              rounded-lg p-4 text-base shadow-sm
              focus:outline-none focus:ring-4 focus:ring-[#1414A0]/30
            "
          />
          <Button type="submit" className="w-full">
            Post Your Story
          </Button>
        </form>

        {/* POSTS FEED */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded-xl shadow border">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {post.text}
              </ReactMarkdown>

              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <span>{moment(post.created_at).format('DD/MM/YYYY, HH:mm')}</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`text-xl ${
                      likedIds.has(post.id) ? 'text-red-500' : 'text-gray-500'
                    }`}
                  >
                    {likedIds.has(post.id) ? '💔' : '❤️'} {post.likes}
                  </button>

                  {post.user_id === userId && (
                    <button onClick={() => handleDelete(post.id, post.user_id)}>
                      <Trash className="h-5 w-5 text-gray-500 hover:text-red-500" />
                    </button>
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
