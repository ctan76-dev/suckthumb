'use client';

import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
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

export default function Home() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [email, setEmail] = useState('');

  // Fetch posts
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setPosts(data);
  };
  useEffect(() => { fetchPosts(); }, []);

  // Auth handlers
  const handleMagicLinkLogin = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert('Check your email for the login link');
  };
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    fetchPosts();
  };

  // Post handlers
  const handleSubmit = async () => {
    if (!newPost.trim()) return;
    await supabase.from('moments').insert([{ text: newPost.trim(), likes: 0 }]);
    setNewPost('');
    fetchPosts();
  };
  const handleLike = async (id: string) => {
    await supabase.rpc('increment_likes', { row_id: id });
    fetchPosts();
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this moment?')) return;
    await supabase.from('moments').delete().eq('id', id);
    fetchPosts();
  };

  return (
    <main className="flex flex-col items-center max-w-xl mx-auto p-6 space-y-8">

      {/* Hero */}
      <section className="w-full bg-blue-50 p-6 rounded-xl shadow text-center space-y-4">
        <h1 className="text-3xl font-bold text-blue-800">Suck Thumb? Share Lah.</h1>
        <p className="text-gray-700">
          Got rejected, missed a chance, kena scolded? <br/>
          Don’t just suck thumb. Bend it here — rant, laugh, or heal.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button onClick={() => document.getElementById('post-form')?.scrollIntoView({ behavior: 'smooth' })}>
            🔵 Share Your Story
          </Button>
          <Button variant="outline" onClick={fetchPosts}>
            🔵 Read Stories
          </Button>
        </div>
      </section>

      {/* Auth */}
      <section className="w-full space-y-4">
        {!session ? (
          <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sm:w-3/4 border px-3 py-2 rounded"
            />
            <Button onClick={handleMagicLinkLogin} className="w-full sm:w-1/2">
              Email Link
            </Button>
            <Button variant="secondary" onClick={handleGoogleLogin} className="w-full sm:w-1/2">
              Continue with Google
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border rounded-lg w-full">
            <span className="text-gray-700">Signed in as <strong>{session.user.email}</strong></span>
            <Button variant="ghost" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        )}
      </section>

      {/* Post Form */}
      {session && (
        <section id="post-form" className="w-full">
          <div className="flex flex-col items-center space-y-3">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What happened today?"
              className="w-full sm:w-3/4"
            />
            <Button onClick={handleSubmit} className="w-full sm:w-1/2">
              Submit
            </Button>
          </div>
        </section>
      )}

      {/* Posts List */}
      <section className="w-full space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No moments yet. Be the first to share!</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-xl shadow border w-full">
              <p className="text-gray-800 whitespace-pre-line text-center">{post.text}</p>
              <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-gray-500">
                <span className="mb-2 sm:mb-0">
                  {moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}
                </span>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" className="text-red-500" onClick={() => handleLike(post.id)}>
                    ❤️ {post.likes}
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(post.id)}>
                    <Trash className="h-5 w-5 text-gray-500 hover:text-red-500" />
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
