'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/types/supabase';
import moment from 'moment';
import { Button } from '@/components/ui/button';

type PostRow = Database['public']['Tables']['moments']['Row'];
type PostAgg = PostRow & {
  comments?: { count: number }[];
  likes?: { count: number }[];
};

type RankedPost = PostRow & {
  comment_count: number;
  like_count: number;
};

export default function WallPage() {
  const supabase = useSupabaseClient<Database>();
  const [posts, setPosts] = useState<RankedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const maskEmail = (email?: string | null) => {
    if (!email || !email.includes('@')) return email ?? 'Anonymous';
    const [user, domain] = email.split('@');
    if (!domain) return 'Anonymous';
    const visible = user.slice(0, 2);
    const maskedUser = `${visible}${'•'.repeat(Math.max(0, Math.min(user.length - visible.length, 2)))}`;
    return `${maskedUser}@${domain}`;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('moments')
        .select('*, comments(count), likes(count)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading wall posts:', error);
        setPosts([]);
        setLoading(false);
        return;
      }

      const mapped = (data ?? []).map((item) => {
        const record = item as PostAgg;
        const { comments, likes, ...rest } = record;
        const comment_count = comments?.[0]?.count ?? 0;
        const like_count = likes?.[0]?.count ?? 0;
        return {
          ...rest,
          comment_count,
          like_count,
        } as RankedPost;
      });

      setPosts(mapped);
      setLoading(false);
    };

    load();
  }, [supabase]);

  const ranked = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (b.comment_count !== a.comment_count) {
        return b.comment_count - a.comment_count;
      }
      return (b.like_count ?? 0) - (a.like_count ?? 0);
    });
  }, [posts]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="glass-surface rounded-3xl border border-white/15 px-6 py-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">The Public Wall</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Moments with the most conversations rise to the top. Jump in, leave a kind note, or borrow inspiration
          from those who&apos;ve been through similar suckthumb moments.
        </p>
        <Button
          variant="ghost"
          className="mt-4 w-fit text-primary"
          onClick={() => (window.location.href = '/')}
        >
          ← Back to home
        </Button>
      </section>

      {loading ? (
        <div className="glass-surface rounded-3xl border border-white/15 px-6 py-8 text-center shadow-xl text-sm text-muted-foreground">
          Loading the wall…
        </div>
      ) : ranked.length === 0 ? (
        <div className="glass-surface rounded-3xl border border-white/15 px-6 py-8 text-center shadow-xl text-sm text-muted-foreground">
          No public posts yet. Be the first to share a moment!
        </div>
      ) : (
        <div className="space-y-4">
          {ranked.map(post => (
            <article
              key={post.id}
              className="glass-surface rounded-3xl border border-white/10 px-6 py-6 shadow-xl"
            >
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{maskEmail(post.user_email)}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {moment(post.created_at).fromNow()}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  <span>{post.comment_count} comments</span>
                  <span>•</span>
                  <span>{post.like_count} likes</span>
                </div>
              </header>

              <p className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap">
                {post.text}
              </p>

              {post.media_url && (
                <div className="mt-4">
                  {post.media_type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.media_url}
                      alt="Post media"
                      className="max-h-80 w-full rounded-2xl object-cover"
                    />
                  ) : post.media_type === 'video' ? (
                    <video
                      controls
                      className="max-h-80 w-full rounded-2xl"
                    >
                      <source src={post.media_url} type="video/mp4" />
                    </video>
                  ) : (
                    <Button asChild variant="outline" className="mt-3 w-full justify-start gap-2">
                      <a href={post.media_url} target="_blank" rel="noopener noreferrer">
                        Download attachment
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
