'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash, User as UserIcon } from 'lucide-react';

// Define your Post type
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
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Fetch which posts the user has liked
  async function fetchMyLikes() {
    if (!userId) {
      setLikedIds(new Set());
      return;
    }
    const { data, error } = await supabase
      .from('likes')
      .select('moment_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading your likes:', error.message);
    } else {
      setLikedIds(new Set(data.map((r: any) => r.moment_id)));
    }
  }

  // Fetch all posts
  async function fetchPosts() {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading posts:', error.message);
    } else {
      setPosts(data as Post[]);
    }
  }

  // Toggle like/unlike for a post
  async function toggleLike(postId: string) {
    if (!userId) {
      alert('Please sign in to like.');
      return;
    }

    const isLiked = likedIds.has(postId);

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('moment_id', postId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('likes')
        .insert([{ moment_id: postId, user_id: userId }]);
    }

    await fetchMyLikes();
    await fetchPosts();
  }

  // Delete a post
  async function handleDelete(id: string, ownerId: string) {
    if (ownerId !== userId) return;
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('moments').delete().eq('id', id);
    if (error) console.error('Error deleting post:', error.message);
    else setPosts(p => p.filter(x => x.id !== id));
  }

  // Submit a new post
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

    if (error) {
      console.error('Error adding post:', error.message);
    } else {
      setNewPost('');
      await fetchPosts();
      await fetchMyLikes();
    }
  }

  // Initial load & refetch on user change
  useEffect(() => {
    fetchPosts();
    fetchMyLikes();
  }, [userId]);

  return (
    <>
      {/* Navigation */}
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

      {/* Main Content */}
      <main className="max-w-xl mx-auto p-4 space-y-6">
        {/* Hero */}
        <div className="bg-blue-800 p-6 rounded-xl shadow text-center border border-blue-800">
          <p className="text-3xl font-bold text-white">
            Got rejected, missed chance, kena scolded?
          </p>
          <p className="text-xl text-white mt-3">
            Vent it here, rant, laugh or heal. Share it!
          </p>
        </div>

        {/* New Post Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            rows={6}
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="What happened today?"
            className="
              w-full bg-white border-2 border-[#1414A0]
              rounded-lg p-4 text-base shadow-sm
              focus:outline-none focus:ring-4 focus:ring-[#1414A0]/30
              transition-shadow
            "
          />
          <Button type="submit" className="w-full">
            Post Your Story
          </Button>
        </form>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded-xl shadow border">
              <div className="text-gray-800 space-y-2">
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
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>{moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}</span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={likedIds.has(post.id) ? 'text-red-500' : 'text-gray-500'}
                    onClick={() => toggleLike(post.id)}
                  >
                    {likedIds.has(post.id) ? '💔' : '❤️'} {post.likes}
                  </Button>

                  {post.user_id === userId && (
                    <Button
                      variant="ghost"
                      size="sm"
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
