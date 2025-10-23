"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import type { Database } from '@/types/supabase';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Link as LinkIcon } from 'lucide-react';

type PostRow = Database['public']['Tables']['moments']['Row'];
type PostAgg = PostRow & {
  comments?: { count: number }[];
  likes?: { count: number }[];
};

type CommentRow = Database['public']['Tables']['comments']['Row'];

type RankedPost = PostRow & {
  comment_count: number;
  like_count: number;
};

export default function WallPage() {
  const supabase = useSupabaseClient<Database>();
  const [posts, setPosts] = useState<RankedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const session = useSession();
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [shareMenuPost, setShareMenuPost] = useState<string | null>(null);

  const maskEmail = (email?: string | null) => {
    if (!email || !email.includes('@')) return email ?? 'Anonymous';
    const [user, domain] = email.split('@');
    if (!domain) return 'Anonymous';
    const visible = user.slice(0, 2);
    const maskedUser = `${visible}${'•'.repeat(Math.max(0, Math.min(user.length - visible.length, 2)))}`;
    return `${maskedUser}@${domain}`;
  };

  const fetchUserLikes = useCallback(async () => {
    if (!session) {
      setUserLikes(new Set());
      return;
    }

    const { data, error } = await supabase
      .from('likes')
      .select('moment_id')
      .eq('user_id', session.user.id);

    if (!error && data) {
      setUserLikes(new Set(data.map(item => item.moment_id)));
    }
  }, [session, supabase]);

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
    fetchUserLikes();
  }, [supabase, fetchUserLikes]);

  const ranked = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (b.comment_count !== a.comment_count) {
        return b.comment_count - a.comment_count;
      }
      return (b.like_count ?? 0) - (a.like_count ?? 0);
    });
  }, [posts]);

  const getSharePayload = (post: RankedPost) => {
    const shareText = post.text.length > 200 ? `${post.text.slice(0, 200)}…` : post.text;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = typeof window !== "undefined" ? `${origin}/wall#post-${post.id}` : origin;
    return { shareText, url };
  };

  const handleShare = async (post: RankedPost) => {
    const { shareText, url } = getSharePayload(post);

    if (navigator.share) {
      try {
        await navigator.share({ title: 'SuckThumb Moment', text: shareText, url });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error('Share failed:', error);
      }
    }

    const postId = String(post.id);
    setShareMenuPost(prev => (prev === postId ? null : postId));

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
      } catch (error) {
        console.error('Clipboard copy failed:', error);
      }
    }
  };

  const handleShareOption = (post: RankedPost, option: 'whatsapp' | 'telegram' | 'facebook' | 'x' | 'copy') => {
    const { shareText, url } = getSharePayload(post);
    const message = `${shareText}\n${url}`;

    if (option === 'copy' && navigator.clipboard) {
      navigator.clipboard
        .writeText(message)
        .catch(() => console.error('Unable to copy link.'));
      return;
    }

    const targetUrl = (() => {
      switch (option) {
        case 'whatsapp':
          return `https://wa.me/?text=${encodeURIComponent(message)}`;
        case 'telegram':
          return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
        case 'facebook':
          return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        case 'x':
          return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
        default:
          return '';
      }
    })();

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLike = async (post: RankedPost) => {
    const postId = String(post.id);
    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const hasLiked = userLikes.has(postId);

    if (hasLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('moment_id', postId)
        .eq('user_id', session.user.id);

      if (!error) {
        const updated = new Set(userLikes);
        updated.delete(postId);
        setUserLikes(updated);
        setPosts(prev =>
          prev.map(item =>
            String(item.id) === postId ? { ...item, like_count: Math.max((item.like_count ?? 0) - 1, 0) } : item
          )
        );
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert([{ moment_id: postId, user_id: session.user.id }]);

      if (!error) {
        const updated = new Set(userLikes);
        updated.add(postId);
        setUserLikes(updated);
        setPosts(prev =>
          prev.map(item =>
            String(item.id) === postId ? { ...item, like_count: (item.like_count ?? 0) + 1 } : item
          )
        );
      }
    }
  };

  const fetchCommentsForPost = async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('moment_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(prev => ({ ...prev, [postId]: data as CommentRow[] }));
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => {
      const updated = new Set(prev);
      if (updated.has(postId)) {
        updated.delete(postId);
      } else {
        updated.add(postId);
        fetchCommentsForPost(postId);
      }
      return updated;
    });
  };

  const handleAddComment = async (postId: string) => {
    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert([{
        moment_id: postId,
        user_id: session.user.id,
        user_email: session.user.email || '',
        text: commentText,
      }]);

    if (!error) {
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      fetchCommentsForPost(postId);
      setPosts(prev =>
        prev.map(item =>
          String(item.id) === postId ? { ...item, comment_count: (item.comment_count ?? 0) + 1 } : item
        )
      );
    }
  };

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
          {ranked.map(post => {
            const postId = String(post.id);
            return (
            <article
              key={postId}
              id={`post-${postId}`}
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

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={userLikes.has(postId) ? 'default' : 'ghost'}
                    size="sm"
                    className={`gap-2 ${userLikes.has(postId) ? '' : 'text-foreground/80'}`}
                    onClick={() => handleLike(post)}
                    disabled={!session}
                  >
                    <Heart className={`h-4 w-4 ${userLikes.has(postId) ? 'fill-current' : ''}`} />
                    {post.like_count ?? 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-foreground/80"
                    onClick={() => toggleComments(postId)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.comment_count ?? 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-foreground/80"
                    onClick={() => handleShare(post)}
                  >
                    <LinkIcon className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {shareMenuPost === postId && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/70 px-3 py-3">
                  <Button variant="outline" size="sm" onClick={() => handleShareOption(post, 'copy')}>
                    Copy link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareOption(post, 'whatsapp')}>
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareOption(post, 'telegram')}>
                    Telegram
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareOption(post, 'facebook')}>
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShareOption(post, 'x')}>
                    X (Twitter)
                  </Button>
                </div>
              )}

              {showComments.has(postId) && (
                <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/60 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Conversation</h4>
                    <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      {comments[postId]?.length ?? 0} replies
                    </span>
                  </div>

                  {session && (
                    <div className="rounded-xl border border-white/40 bg-white/80 p-3 shadow-inner">
                      <Textarea
                        value={newComment[postId] || ''}
                        onChange={e =>
                          setNewComment(prev => ({
                            ...prev,
                            [postId]: e.target.value,
                          }))
                        }
                        placeholder="Add a thoughtful reply…"
                        rows={2}
                      />
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(postId)}
                          disabled={!newComment[postId]?.trim()}
                        >
                          Post comment
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(comments[postId] ?? []).map(comment => (
                      <div
                        key={comment.id}
                        className="rounded-xl border border-white/40 bg-white/80 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {maskEmail(comment.user_email)}
                            </p>
                            <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{comment.text}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                              {moment(comment.created_at).format('DD MMM YYYY • HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(comments[postId] ?? []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No comments yet. Be the first to share some kindness.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
