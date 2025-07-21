'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash, User as UserIcon, Edit, Heart, MessageCircle, X, Upload, Link as LinkIcon, File, Image, Video } from 'lucide-react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';

// Define your Post type
type Post = {
  id: string;
  text: string;
  created_at: string;
  likes: number;
  user_id: string;
  user_email?: string;
  media_url?: string;
  media_type?: string;
};

// Define Comment type
type Comment = {
  id: string;
  moment_id: string;
  user_id: string;
  user_email: string;
  text: string;
  created_at: string;
};

// Define Media type
type MediaFile = {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'file';
  name: string;
};

export default function HomePage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  
  // Comment states
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Media states
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
    if (session) {
      fetchUserLikes();
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchUserLikes = async () => {
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
  };

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
        [postId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleComments = (postId: string) => {
    const newShowComments = new Set(showComments);
    if (newShowComments.has(postId)) {
      newShowComments.delete(postId);
    } else {
      newShowComments.add(postId);
      fetchComments(postId);
    }
    setShowComments(newShowComments);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        let type: 'image' | 'video' | 'file' = 'file';
        
        if (file.type.startsWith('image/')) {
          type = 'image';
        } else if (file.type.startsWith('video/')) {
          type = 'video';
        }

        setMediaFiles(prev => [...prev, {
          file,
          preview,
          type,
          name: file.name
        }]);
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

      // Upload the first media file
      const mediaFile = mediaFiles[0];
      const fileExt = mediaFile.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${session?.user.id}/${fileName}`;

      console.log('Uploading file:', fileName, 'to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, mediaFile.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        alert(`Upload failed: ${uploadError.message}`);
        return null;
      }

      console.log('File uploaded successfully');

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || (!newPost.trim() && mediaFiles.length === 0 && !linkUrl)) return;

    setIsLoading(true);
    try {
      console.log('Starting post creation...');
      console.log('Text:', newPost);
      console.log('Media files:', mediaFiles.length);
      console.log('Link URL:', linkUrl);

      const mediaUrl = await uploadMedia();
      console.log('Media URL result:', mediaUrl);
      
      const postData = {
        text: newPost,
        user_id: session.user.id,
        likes: 0,
        media_url: mediaUrl,
        media_type: mediaFiles.length > 0 ? mediaFiles[0].type : (linkUrl ? 'link' : null)
      };

      console.log('Post data to insert:', postData);

      const { data, error } = await supabase
        .from('moments')
        .insert([postData])
        .select();

      if (error) {
        console.error('Error creating post:', error);
        alert(`Failed to create post: ${error.message}`);
        return;
      }

      console.log('Post created successfully:', data);

      setNewPost('');
      setMediaFiles([]);
      setLinkUrl('');
      setShowMediaOptions(false);
      fetchPosts(); // Refresh posts
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) return;

    const isLiked = userLikes.has(postId);
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('moment_id', postId)
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error unliking post:', error);
          return;
        }

        // Update likes count
        await supabase
          .from('moments')
          .update({ likes: posts.find(p => p.id === postId)?.likes! - 1 })
          .eq('id', postId);

        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              moment_id: postId,
              user_id: session.user.id
            }
          ]);

        if (error) {
          console.error('Error liking post:', error);
          return;
        }

        // Update likes count
        await supabase
          .from('moments')
          .update({ likes: posts.find(p => p.id === postId)?.likes! + 1 })
          .eq('id', postId);

        setUserLikes(prev => new Set(prev).add(postId));
      }

      fetchPosts(); // Refresh posts to get updated like counts
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
      // Delete likes first
      await supabase
        .from('likes')
        .delete()
        .eq('moment_id', postId);

      // Delete comments first
      await supabase
        .from('comments')
        .delete()
        .eq('moment_id', postId);

      // Delete the post
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
            text: commentText
          }
        ]);

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Clear the comment input
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));

      // Refresh comments
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
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', session?.user.id);

      if (error) {
        console.error('Error updating comment:', error);
        return;
      }

      setEditingComment(null);
      setEditCommentText('');
      
      // Refresh comments for all posts
      Object.keys(comments).forEach(postId => {
        fetchComments(postId);
      });
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
        <div className="mt-3">
          <img 
            src={post.media_url} 
            alt="Post media" 
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: '400px' }}
          />
        </div>
      );
    }

    if (post.media_type === 'video') {
      return (
        <div className="mt-3">
          <video 
            controls 
            className="max-w-full h-auto rounded-lg"
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
        <div className="mt-3">
          <a 
            href={post.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {post.media_url}
          </a>
        </div>
      );
    }

    if (post.media_type === 'file') {
      return (
        <div className="mt-3">
          <a 
            href={post.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <File className="h-4 w-4" />
            Download File
          </a>
        </div>
      );
    }

    return null;
  };

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
              <Button onClick={() => window.location.href = '/profile'}>Profile</Button>
              <Button variant="destructive" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth'; }}>Sign Out</Button>
            </>
          ) : (
            <Button onClick={() => window.location.href = '/auth'}>Sign In / Sign Up</Button>
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
        {session ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Textarea
              rows={6}
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="What happened today? Share your story..."
              className="w-full bg-white border-2 border-[#1414A0] rounded-lg p-4 text-base shadow-sm focus:outline-none focus:ring-4 focus:ring-[#1414A0]/30 transition-shadow"
              disabled={isLoading}
            />
            
            {/* Media Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaOptions(!showMediaOptions)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Add Media
                </Button>
                {(mediaFiles.length > 0 || linkUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMediaFiles([]);
                      setLinkUrl('');
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>

              {showMediaOptions && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Photos, Videos, or Files
                    </label>
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
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Files
                    </Button>
                  </div>

                  {/* Link Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add a Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="space-y-2">
                  {mediaFiles.map((media, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      {media.type === 'image' && (
                        <Image className="h-4 w-4 text-blue-500" />
                      )}
                      {media.type === 'video' && (
                        <Video className="h-4 w-4 text-red-500" />
                      )}
                      {media.type === 'file' && (
                        <File className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="flex-1 text-sm truncate">{media.name}</span>
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
                </div>
              )}

              {linkUrl && (
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <LinkIcon className="h-4 w-4 text-green-500" />
                  <span className="flex-1 text-sm truncate">{linkUrl}</span>
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (!newPost.trim() && mediaFiles.length === 0 && !linkUrl)}
            >
              {isLoading ? 'Posting...' : 'Post Your Story'}
            </Button>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600 mb-3">Sign in to post your stories!</p>
            <Button onClick={() => window.location.href = '/auth'}>Sign In / Sign Up</Button>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <div className="text-center text-gray-500">No posts to display.</div>
          )}
          {posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded-xl shadow border">
              {editingPost === post.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="w-full"
                    rows={4}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(post.id)}
                      disabled={!editText.trim()}
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
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
                    {renderMedia(post)}
                  </div>
                </>
              )}
              
              {/* Post Actions */}
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>{moment(post.created_at).format('DD/MM/YYYY, HH:mm:ss')}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 ${userLikes.has(post.id) ? 'text-red-500' : 'text-gray-400'}`}
                    onClick={() => handleLike(post.id)}
                    disabled={!session}
                  >
                    <Heart className={`h-4 w-4 ${userLikes.has(post.id) ? 'fill-current' : ''}`} />
                    {post.likes || 0}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 flex items-center gap-1"
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {comments[post.id]?.length || 0}
                  </Button>
                  
                  {session && post.user_id === session.user.id && editingPost !== post.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400"
                        onClick={() => startEdit(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              {showComments.has(post.id) && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Comments</h4>
                  
                  {/* Add Comment */}
                  {session && (
                    <div className="mb-4">
                      <Textarea
                        value={newComment[post.id] || ''}
                        onChange={e => setNewComment(prev => ({
                          ...prev,
                          [post.id]: e.target.value
                        }))}
                        placeholder="Add a comment..."
                        className="w-full mb-2"
                        rows={2}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                      >
                        Comment
                      </Button>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3">
                    {comments[post.id]?.length === 0 && (
                      <p className="text-gray-500 text-sm">No comments yet.</p>
                    )}
                    {comments[post.id]?.map(comment => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                        {editingComment === comment.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editCommentText}
                              onChange={e => setEditCommentText(e.target.value)}
                              className="w-full"
                              rows={2}
                            />
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleEditComment(comment.id)}
                                disabled={!editCommentText.trim()}
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
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
                          <>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">
                                  {comment.user_email}
                                </p>
                                <p className="text-gray-800 mt-1">{comment.text}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {moment(comment.created_at).format('DD/MM/YYYY, HH:mm')}
                                </p>
                              </div>
                              {session && comment.user_id === session.user.id && (
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 p-1"
                                    onClick={() => startEditComment(comment)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 p-1"
                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
