'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { GlassCard } from '@/components/shared/GlassCard';
import { ArrowLeft, MessageSquare, Eye, ArrowUpCircle, CheckCircle2, Loader2, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ForumPostDetailsPage() {
  const { id } = useParams();
  const { user } = useUser();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Increment view count on mount
  useEffect(() => {
    if (id) {
      supabase.rpc('increment_forum_view', { p_post_id: id }).then();
    }
  }, [id, supabase]);

  const { data: post, isLoading: postLoading, refetch: refetchPost } = useQuery({
    queryKey: ['forum-post', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:profiles!forum_posts_author_id_fkey(id, username)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;

      let upvoted_by_me = false;
      if (user) {
        const { data: upvote } = await supabase
          .from('forum_upvotes')
          .select('*')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .single();
        if (upvote) upvoted_by_me = true;
      }

      return { ...data, upvoted_by_me };
    },
  });

  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useQuery({
    queryKey: ['forum-comments', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_comments')
        .select(`
          *,
          author:profiles!forum_comments_author_id_fkey(id, username)
        `)
        .eq('post_id', id)
        .order('is_solution', { ascending: false }) // Solutions first
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data;
    },
  });

  const handleUpvote = async () => {
    if (!user) return toast.error('You must be logged in to upvote');
    try {
      const { error } = await supabase.rpc('toggle_forum_upvote', { p_post_id: id });
      if (error) throw error;
      refetchPost();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upvote');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('You must be logged in to comment');
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: id,
          author_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      refetchComments();
      toast.success('Reply posted!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkSolution = async (commentId: string, currentStatus: boolean) => {
    if (!user || user.id !== post?.author_id) return;

    try {
      // First, unmark any existing solution for this post
      if (!currentStatus) {
        await supabase
          .from('forum_comments')
          .update({ is_solution: false })
          .eq('post_id', id)
          .eq('is_solution', true);
      }

      // Then toggle this one
      const { error } = await supabase
        .from('forum_comments')
        .update({ is_solution: !currentStatus })
        .eq('id', commentId);

      if (error) throw error;
      refetchComments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update solution status');
    }
  };

  const handleDeletePost = async () => {
    if (!user || user.id !== post?.author_id) return;
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Post deleted successfully');
      router.push('/dashboard/campus');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('forum_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      refetchComments();
      toast.success('Comment deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete comment');
    }
  };

  if (postLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent-violet" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Post not found</h2>
        <Link href="/dashboard/campus" className="text-accent-violet mt-4 inline-block hover:underline">
          Return to Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-page-in pb-12">
      {/* Header */}
      <div>
        <Link 
          href="/dashboard/campus" 
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-accent-violet transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Forum
        </Link>
      </div>

      {/* Main Post */}
      <GlassCard padding="lg" className="border-accent-violet/20">
        <div className="flex gap-6">
          {/* Upvote Column */}
          <div className="hidden sm:flex flex-col items-center justify-start gap-1 shrink-0 pt-2">
            <button 
              onClick={handleUpvote}
              className={cn(
                'p-2 rounded-xl transition-all',
                post.upvoted_by_me 
                  ? 'text-accent-emerald bg-accent-emerald/10' 
                  : 'text-[var(--text-muted)] hover:text-accent-emerald hover:bg-accent-emerald/10 border border-transparent hover:border-accent-emerald/20'
              )}
            >
              <ArrowUpCircle size={28} className={post.upvoted_by_me ? "fill-accent-emerald/20" : ""} />
            </button>
            <span className={cn(
              'text-lg font-bold',
              post.upvoted_by_me ? 'text-accent-emerald' : 'text-[var(--text-primary)]'
            )}>
              {post.upvotes}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs font-bold px-2 py-1 rounded border border-[var(--glass-border)] bg-[var(--bg-surface-solid)] text-[var(--text-muted)] uppercase tracking-wider">
                {post.category}
              </span>
              {post.tags?.map((tag: string) => (
                <span key={tag} className="text-xs font-medium px-2 py-1 rounded bg-[var(--bg-surface)] text-[var(--text-muted)]">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {post.title}
              </h1>

              {user?.id === post.author_id && (
                <div className="flex items-center gap-2 shrink-0">
                  <Link 
                    href={`/dashboard/campus/edit/${id}`}
                    className="p-2 rounded-lg bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-accent-violet hover:border-accent-violet/30 transition-all"
                    title="Edit Post"
                  >
                    <Edit2 size={18} />
                  </Link>
                  <button 
                    onClick={handleDeletePost}
                    className="p-2 rounded-lg bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-accent-coral hover:border-accent-coral/30 transition-all"
                    title="Delete Post"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-surface-solid)] shrink-0">
                <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${post.author.username}&backgroundColor=FFF9E9`} alt={post.author.username} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--text-primary)]">@{post.author.username}</span>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="prose prose-sm sm:prose-base prose-invert max-w-none text-[var(--text-primary)] mb-6 whitespace-pre-wrap">
              {post.content}
            </div>

            {/* Mobile Upvote & Stats */}
            <div className="flex items-center gap-6 pt-4 border-t border-[var(--glass-border)]">
              <div className="flex sm:hidden items-center gap-2">
                <button 
                  onClick={handleUpvote}
                  className={cn('transition-all', post.upvoted_by_me ? 'text-accent-emerald' : 'text-[var(--text-muted)]')}
                >
                  <ArrowUpCircle size={24} className={post.upvoted_by_me ? "fill-accent-emerald/20" : ""} />
                </button>
                <span className={cn('font-bold', post.upvoted_by_me ? 'text-accent-emerald' : '')}>{post.upvotes}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
                <Eye size={18} /> {post.view_count} Views
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Replies Section */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] flex items-center gap-2 pl-2">
          <MessageSquare size={18} className="text-accent-violet" />
          {comments?.length || 0} {comments?.length === 1 ? 'Reply' : 'Replies'}
        </h3>

        {/* Comment Form */}
        {user && (
          <GlassCard padding="md">
            <form onSubmit={handlePostComment}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write your reply..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-accent-violet/50 transition-colors resize-none mb-3"
                rows={4}
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-accent-violet text-white rounded-lg text-sm font-semibold shadow-lg shadow-accent-violet/25 hover:shadow-accent-violet/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Post Reply
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Comments List */}
        <div className="space-y-4 pt-2">
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            comments?.map((comment: any) => (
              <GlassCard 
                key={comment.id} 
                padding="md" 
                className={cn(
                  "relative transition-all",
                  comment.is_solution ? "border-accent-emerald/30 bg-accent-emerald/5" : ""
                )}
              >
                {comment.is_solution && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-accent-emerald text-white rounded-full text-[10px] font-bold uppercase shadow-lg shadow-accent-emerald/20">
                    <CheckCircle2 size={12} /> Solution
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-surface-solid)] shrink-0">
                    <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${comment.author.username}&backgroundColor=FFF9E9`} alt={comment.author.username} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">@{comment.author.username}</span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Author tools */}
                      <div className="flex items-center gap-2">
                        {user?.id === post.author_id && (
                          <button
                            onClick={() => handleMarkSolution(comment.id, comment.is_solution)}
                            className={cn(
                              "text-xs font-semibold px-2 py-1 rounded transition-colors flex items-center gap-1",
                              comment.is_solution 
                                ? "text-accent-emerald hover:bg-accent-emerald/10" 
                                : "text-[var(--text-muted)] hover:text-accent-emerald hover:bg-accent-emerald/10"
                            )}
                          >
                            <CheckCircle2 size={14} />
                            {comment.is_solution ? 'Unmark' : 'Mark as Solution'}
                          </button>
                        )}
                        {user?.id === comment.author_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-accent-coral hover:bg-accent-coral/10 transition-colors"
                            title="Delete Comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
