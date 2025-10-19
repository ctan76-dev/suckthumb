'use client';

import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import NextImage from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash, Edit, Heart, MessageCircle, X, Upload, Link as LinkIcon, File, Image as ImageIcon, Video } from 'lucide-react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import type { Database } from '@/types/supabase';

type Post = Database['public']['Tables']['moments']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'];

type MediaFile = {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'file';
  name: string;
};

export default function HomePage() {
  const supabase = useSupabaseClient<Database>();
  const session = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [composerAlert, setComposerAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userEmail = session?.user.email ?? 'Guest';
  const avatarUrl = session?.user.user_metadata?.avatar_url as string | undefined;
  const userInitial = userEmail.charAt(0).toUpperCase();
  const curatedPrompts = [
    'Share a tiny win from today.',
    'What made you smile despite the chaos?',
    'Confess an “oops” moment you can laugh about now.',
    'Who surprised you with kindness?',
  ];

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data ?? []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [supabase]);

  const fetchUserLikes = useCallback(async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('moment_id')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching user likes:', error);
        return;
      }

      const likedPostIds = new Set(data?.map(like => like.moment_id) || []);
      setUserLikes(likedPostIds);
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  }, [session, supabase]);

  useEffect(() => {
    fetchPosts();
    if (session) {
      fetchUserLikes();
    }
  }, [fetchPosts, fetchUserLikes, session]);

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('moment_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      setComments(prev => ({
        ...prev,
        [postId]: data || [],
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => {
      const updated = new Set(prev);
      if (updated.has(postId)) {
        updated.delete(postId);
      } else {
        updated.add(postId);
        fetchComments(postId);
      }
      return updated;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const preview = e.target?.result as string;
        let type: 'image' | 'video' | 'file' = 'file';

        if (file.type.startsWith('image/')) {
          type = 'image';
        } else if (file.type.startsWith('video/')) {
          type = 'video';
        }

        setMediaFiles(prev => [
          ...prev,
          {
            file,
            preview,
            type,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (mediaFiles.length === 0 && !linkUrl) return null;

    try {
      if (linkUrl) {
        return linkUrl;
      }

      if (!session) return null;

      const mediaFile = mediaFiles[0];
      const fileExt = mediaFile.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, mediaFile.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setComposerAlert({ type: 'error', message: uploadError.message });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      setComposerAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
      });
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || (!newPost.trim() && mediaFiles.length === 0 && !linkUrl)) return;

    setIsLoading(true);
    setComposerAlert(null);

    try {
      const mediaUrl = await uploadMedia();
      if (mediaFiles.length > 0 && !mediaUrl) {
        setIsLoading(false);
        return;
      }

      const postData = {
        text: newPost,
        user_id: session.user.id,
        user_email: session.user.email,
        likes: 0,
        media_url: mediaUrl,
        media_type: mediaFiles.length > 0 ? mediaFiles[0].type : (linkUrl ? 'link' : null),
      };

      const { error } = await supabase
        .from('moments')
        .insert([postData]);

      if (error) {
        setComposerAlert({ type: 'error', message: error.message });
        return;
      }

      setComposerAlert({ type: 'success', message: 'Moment shared successfully.' });
      setNewPost('');
      setMediaFiles([]);
      setLinkUrl('');
      setShowMediaOptions(false);
      fetchPosts();
    } catch (error) {
      setComposerAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create post.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) return;

    const isLiked = userLikes.has(postId);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('moment_id', postId)
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error unliking post:', error);
          return;
        }

        const currentLikes = posts.find(p => p.id === postId)?.likes ?? 0;

        await supabase
          .from('moments')
          .update({ likes: Math.max(currentLikes - 1, 0) })
          .eq('id', postId);

        setUserLikes(prev => {
          const updated = new Set(prev);
          updated.delete(postId);
          return updated;
        });
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              moment_id: postId,
              user_id: session.user.id,
            },
          ]);

        if (error) {
          console.error('Error liking post:', error);
          return;
        }

        const currentLikes = posts.find(p => p.id === postId)?.likes ?? 0;

        await supabase
          .from('moments')
          .update({ likes: currentLikes + 1 })
          .eq('id', postId);

        setUserLikes(prev => new Set(prev).add(postId));
      }

      fetchPosts();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleEdit = async (postId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('moments')
        .update({ text: editText })
        .eq('id', postId)
        .eq('user_id', session?.user.id);

      if (error) {
        console.error('Error updating post:', error);
        return;
      }

      setEditingPost(null);
      setEditText('');
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await supabase.from('likes').delete().eq('moment_id', postId);
      await supabase.from('comments').delete().eq('moment_id', postId);

      const { error } = await supabase
        .from('moments')
        .delete()
        .eq('id', postId)
        .eq('user_id', session?.user.id);

      if (error) {
        console.error('Error deleting post:', error);
        return;
      }

      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = newComment[postId];
    if (!session || !commentText?.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            moment_id: postId,
            user_id: session.user.id,
            user_email: session.user.email || '',
            text: commentText,
          },
        ]);

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      setNewComment(prev => ({
        ...prev,
        [postId]: '',
      }));

      fetchComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          text: editCommentText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', session?.user.id);

      if (error) {
        console.error('Error updating comment:', error);
        return;
      }

      setEditingComment(null);
      setEditCommentText('');
      Object.keys(comments).forEach(postId => fetchComments(postId));
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', session?.user.id);

      if (error) {
        console.error('Error deleting comment:', error);
        return;
      }

      fetchComments(postId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const startEdit = (post: Post) => {
    setEditingPost(post.id);
    setEditText(post.text);
  };

  const startEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.text);
  };

  const renderMedia = (post: Post) => {
    if (!post.media_url) return null;

    if (post.media_type === 'image') {
      return (
        <div className="relative mt-4 overflow-hidden rounded-2xl ring-1 ring-border/60 bg-black/5 aspect-[4/3]">
          <NextImage
            src={post.media_url}
            alt="Shared moment image"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      );
    }

    if (post.media_type === 'video') {
      return (
        <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-border/60 bg-black/5">
          <video
            controls
            className="h-full w-full object-cover"
            style={{ maxHeight: '400px' }}
          >
            <source src={post.media_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (post.media_type === 'link') {
      return (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary/90 ring-1 ring-primary/15">
          <a
            href={post.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 break-all hover:underline"
          >
            <LinkIcon className="h-4 w-4" />
            {post.media_url}
          </a>
        </div>
      );
    }

    if (post.media_type === 'file') {
      return (
        <div className="mt-4">
          <Button asChild variant="outline" className="w-full justify-start gap-2">
            <a href={post.media_url} target="_blank" rel="noopener noreferrer">
              <File className="h-4 w-4" />
              Download attachment
            </a>
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)]"
        aria-hidden
      />

      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full glass-surface px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary ring-gradient">
              ST
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/60">
                Your daily vent space
              </p>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                SuckThumb
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => {
                    window.location.href = '/profile';
                  }}
                >
                  Profile
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    document.getElementById('composer')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  New moment
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/auth';
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  window.location.href = '/auth';
                }}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2.3fr)_minmax(260px,1fr)]">
          <section className="space-y-6">
            <div className="glass-surface overflow-hidden rounded-3xl border border-white/10 px-8 py-10 text-center shadow-2xl sm:text-left">
              <p className="text-xs uppercase tracking-[0.5em] text-primary/70">
                Breathe it out
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Turn your rough day into a shared moment
              </h1>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                Rant, laugh, heal. This is your safe wall to feel better together.
              </p>
            </div>

            {session ? (
              <form
                id="composer"
                className="glass-surface rounded-3xl border border-white/20 p-6 shadow-xl sm:p-8"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="relative shrink-0">
                    <div className="ring-gradient flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                      {avatarUrl ? (
                        <NextImage
                          src={avatarUrl}
                          alt="Your avatar"
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-2xl object-cover"
                          unoptimized
                        />
                      ) : (
                        userInitial
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Your story
                      </label>
                      <Textarea
                        rows={6}
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        placeholder="How was today? Share the moment so we can feel it with you."
                        disabled={isLoading}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{newPost.trim().length} characters</span>
                        <span>Be kind. Be real.</span>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMediaOptions(prev => !prev)}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {showMediaOptions ? 'Hide media options' : 'Add media'}
                        </Button>
                        {(mediaFiles.length > 0 || linkUrl) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              setMediaFiles([]);
                              setLinkUrl('');
                            }}
                          >
                            <X className="h-4 w-4" />
                            Clear attachments
                          </Button>
                        )}
                      </div>

                      {showMediaOptions && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground/80">
                              Upload photos, videos, or files
                            </p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full gap-2"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4" />
                              Choose files
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground/80">Link an external resource</p>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={linkUrl}
                                onChange={e => setLinkUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 rounded-xl border border-border/60 bg-white/60 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setLinkUrl('')}
                                disabled={!linkUrl}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {(mediaFiles.length > 0 || linkUrl) && (
                        <div className="space-y-2 rounded-xl bg-white/70 p-3 text-sm text-muted-foreground shadow-inner">
                          {mediaFiles.map((media, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 rounded-lg border border-border/40 bg-white/80 px-3 py-2"
                            >
                              {media.type === 'image' && <ImageIcon className="h-4 w-4 text-primary" />}
                              {media.type === 'video' && <Video className="h-4 w-4 text-rose-500" />}
                              {media.type === 'file' && <File className="h-4 w-4 text-muted-foreground" />}
                              <span className="flex-1 truncate text-sm font-medium text-foreground/80">{media.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMediaFile(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}

                          {linkUrl && (
                            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                              <LinkIcon className="h-4 w-4 text-primary" />
                              <span className="flex-1 truncate text-sm font-medium text-primary/80">{linkUrl}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setLinkUrl('')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {composerAlert && (
                      <div
                        className={`rounded-xl border px-4 py-3 text-sm ${
                          composerAlert.type === 'error'
                            ? 'border-destructive/40 bg-destructive/10 text-destructive'
                            : 'border-primary/30 bg-primary/10 text-primary'
                        }`}
                      >
                        {composerAlert.message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoading || (!newPost.trim() && mediaFiles.length === 0 && !linkUrl)}
                    >
                      {isLoading ? 'Posting…' : 'Share this moment'}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="glass-surface rounded-3xl border border-white/15 p-8 text-center shadow-xl">
                <p className="text-lg font-medium text-foreground">Want to vent or celebrate?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a free account to start posting moments and reacting with the community.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button onClick={() => (window.location.href = '/auth')}>Sign in to share</Button>
                  <Button variant="ghost" onClick={() => (window.location.href = '/wall')}>
                    Browse the wall
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {posts.length === 0 && (
                <div className="glass-surface rounded-3xl border border-dashed border-primary/20 p-8 text-center text-muted-foreground">
                  No posts yet. Be the first to share a moment today.
                </div>
              )}

              {posts.map(post => {
                const postInitial = (post.user_email ?? 'Anonymous').charAt(0).toUpperCase();
                const isOwner = session && post.user_id === session.user.id;
                const isLiked = userLikes.has(post.id);

                return (
                  <div key={post.id} className="glass-surface rounded-3xl border border-white/10 p-6 shadow-xl">
                    {editingPost === post.id ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={4}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(post.id)}
                            disabled={!editText.trim()}
                          >
                            Save changes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPost(null);
                              setEditText('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="ring-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-base font-semibold text-primary">
                              {post.user_email ? postInitial : 'ST'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {post.user_email || 'Anonymous'}
                              </p>
                              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                {moment(post.created_at).fromNow()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{(post.likes ?? 0)} likes</span>
                            <span>•</span>
                            <span>{comments[post.id]?.length || 0} replies</span>
                          </div>
                        </div>

                        <div className="prose prose-sm mt-5 max-w-none text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {post.text}
                          </ReactMarkdown>
                        </div>

                        {renderMedia(post)}
                      </>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/50 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant={isLiked ? 'default' : 'ghost'}
                          size="sm"
                          className={`gap-2 ${isLiked ? '' : 'text-foreground/80'}`}
                          onClick={() => handleLike(post.id)}
                          disabled={!session}
                        >
                          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                          {post.likes ?? 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-foreground/80"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {comments[post.id]?.length || 0}
                        </Button>
                      </div>

                      {isOwner && editingPost !== post.id && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-foreground/70"
                            onClick={() => startEdit(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {showComments.has(post.id) && (
                      <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/60 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">Conversation</h4>
                          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            {comments[post.id]?.length || 0} replies
                          </span>
                        </div>

                        {session && (
                          <div className="rounded-xl border border-white/40 bg-white/80 p-3 shadow-inner">
                            <Textarea
                              value={newComment[post.id] || ''}
                              onChange={e =>
                                setNewComment(prev => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Add a thoughtful reply…"
                              rows={2}
                            />
                            <div className="mt-2 flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComment[post.id]?.trim()}
                              >
                                Post comment
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          {comments[post.id]?.length === 0 && (
                            <p className="rounded-xl border border-dashed border-border/50 bg-white/60 p-4 text-sm text-muted-foreground">
                              No comments yet. Start the conversation.
                            </p>
                          )}

                          {comments[post.id]?.map(comment => (
                            <div
                              key={comment.id}
                              className="rounded-xl border border-white/40 bg-white/80 p-4 shadow-sm"
                            >
                              {editingComment === comment.id ? (
                                <div className="space-y-3">
                                  <Textarea
                                    value={editCommentText}
                                    onChange={e => setEditCommentText(e.target.value)}
                                    rows={2}
                                  />
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditComment(comment.id)}
                                      disabled={!editCommentText.trim()}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingComment(null);
                                        setEditCommentText('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {comment.user_email ?? 'Anonymous'}
                                    </p>
                                    <p className="mt-1 text-sm text-foreground/80">{comment.text}</p>
                                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                      {moment(comment.created_at).format('DD MMM YYYY • HH:mm')}
                                    </p>
                                  </div>
                                  {session && comment.user_id === session.user.id && (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-foreground/70"
                                        onClick={() => startEditComment(comment)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={() => handleDeleteComment(comment.id, post.id)}
                                      >
                                        <Trash className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            {session && (
              <div className="glass-surface rounded-3xl border border-white/15 p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="ring-gradient flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                    {avatarUrl ? (
                      <NextImage
                        src={avatarUrl}
                        alt="Your avatar"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-2xl object-cover"
                        unoptimized
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{userEmail}</p>
                    <p className="text-xs text-muted-foreground">Signed in • ready to share</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <p>Need a spark? Try one of these prompts:</p>
                  <ul className="space-y-2">
                    {curatedPrompts.map(prompt => (
                      <li
                        key={prompt}
                        className="rounded-xl border border-dashed border-primary/20 bg-primary/5 px-3 py-2 text-primary/80"
                      >
                        {prompt}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="mt-5 w-full"
                  variant="subtle"
                  onClick={() => {
                    document.getElementById('composer')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Start with a prompt
                </Button>
              </div>
            )}

            <div className="glass-surface rounded-3xl border border-white/15 p-6 shadow-xl">
              <h3 className="text-base font-semibold text-foreground">Community vibes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Support others by reacting or leaving encouraging notes. We moderate so everyone feels safe.
              </p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/60 px-3 py-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>Leave a ❤️ when something resonates.</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/60 px-3 py-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>Reply with empathy. People remember kind words.</span>
                </div>
              </div>
              <Button
                variant="ghost"
                className="mt-5 w-full text-primary"
                onClick={() => (window.location.href = '/wall')}
              >
                Explore the public wall →
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
