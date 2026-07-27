'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Eye, Loader2, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  view_count: number;
  created_at: string;
  author: {
    id: string;
    username: string;
  };
  comments: { count: number }[];
  upvoted_by_me?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All Discussions' },
  { id: 'general', label: 'General' },
  { id: 'help', label: 'Q&A / Help' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'discussion', label: 'Discussion' },
];

interface ForumTabProps {
  searchQuery: string;
}

export function ForumTab({ searchQuery }: ForumTabProps) {
  const { user } = useUser();
  const [supabase] = useState(() => createClient());
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['forum-posts', activeCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          author:profiles!forum_posts_author_id_fkey(id, username),
          comments:forum_comments(count)
        `)
        .order('created_at', { ascending: false });

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }
      
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let upvotedIds = new Set<string>();
      if (user && data.length > 0) {
        const { data: upvotes } = await supabase
          .from('forum_upvotes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', data.map(p => p.id));
          
        if (upvotes) {
          upvotedIds = new Set(upvotes.map(u => u.post_id));
        }
      }

      return data.map(post => ({
        ...post,
        upvoted_by_me: upvotedIds.has(post.id)
      })) as ForumPost[];
    },
  });

  const handleUpvote = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!user) return toast.error('You must be logged in to upvote');

    try {
      const { error } = await supabase.rpc('toggle_forum_upvote', { p_post_id: postId });
      if (error) throw error;
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upvote');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 text-[11px] font-heading font-black uppercase tracking-widest transition-all whitespace-nowrap border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]',
              activeCategory === cat.id
                ? 'bg-neo-purple text-white shadow-none translate-x-[2px] translate-y-[2px]'
                : 'bg-white text-neo-ink hover:bg-neo-yellow'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="animate-spin text-neo-purple" />
            <span className="font-heading font-black uppercase tracking-widest text-neo-ink">Loading Discussions...</span>
          </div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-20 border-[3px] border-neo-ink bg-neo-surface shadow-[4px_4px_0_#111111]">
            <MessageSquare size={48} strokeWidth={2} className="mx-auto mb-4 text-neo-ink/20" />
            <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-neo-ink mb-2">No discussions found</h3>
            <p className="font-bold uppercase tracking-widest text-xs text-neo-ink/60">Be the first to start a conversation here!</p>
          </div>
        ) : (
          posts?.map(post => (
            <Link key={post.id} href={`/dashboard/forum/${post.id}`}>
              <div className="ss-card border-[3px] p-6 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] transition-all flex flex-col sm:flex-row gap-4 sm:gap-6 group bg-white">
                <div className="hidden sm:flex flex-col items-center justify-start gap-1 shrink-0 pt-1">
                  <button 
                    onClick={(e) => handleUpvote(post.id, e)}
                    className={cn(
                      'p-2 border-[2px] border-neo-ink transition-all shadow-[2px_2px_0_#111111] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none',
                      post.upvoted_by_me 
                        ? 'bg-neo-green text-neo-ink' 
                        : 'bg-white text-neo-ink hover:bg-neo-yellow'
                    )}
                  >
                    <ArrowUpCircle size={20} strokeWidth={3} />
                  </button>
                  <span className={cn(
                    'text-base font-heading font-black mt-1',
                    post.upvoted_by_me ? 'text-neo-green' : 'text-neo-ink'
                  )}>
                    {post.upvotes}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-1 bg-neo-yellow border-[2px] border-neo-ink text-neo-ink uppercase tracking-widest">
                      {post.category}
                    </span>
                    <span className="text-[10px] font-bold text-neo-ink/60 uppercase tracking-widest">
                      BY @{post.author?.username}
                    </span>
                    <span className="text-[10px] text-neo-ink/30 hidden sm:inline">•</span>
                    <span className="text-[10px] font-bold text-neo-ink/60 uppercase tracking-widest hidden sm:inline">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-xl text-neo-ink mb-2 group-hover:text-neo-purple transition-colors line-clamp-2 uppercase tracking-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-sm font-medium text-neo-ink/80 line-clamp-2 mb-4 leading-relaxed">
                    {post.content}
                  </p>

                  <div className="flex items-center flex-wrap gap-2">
                    {post.tags?.map(tag => (
                      <span key={tag} className="text-[10px] font-bold px-2 py-1 bg-neo-surface border-[2px] border-neo-ink text-neo-ink uppercase tracking-widest">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0 sm:w-24 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t-[3px] sm:border-t-0 sm:border-l-[3px] border-neo-ink pl-0 sm:pl-4">
                  <div className="flex sm:hidden items-center gap-2">
                    <button 
                      onClick={(e) => handleUpvote(post.id, e)}
                      className={cn(
                        'p-1.5 border-[2px] border-neo-ink transition-all',
                        post.upvoted_by_me ? 'bg-neo-green text-neo-ink' : 'bg-white text-neo-ink'
                      )}
                    >
                      <ArrowUpCircle size={16} strokeWidth={3} />
                    </button>
                    <span className={cn('text-sm font-heading font-black', post.upvoted_by_me ? 'text-neo-green' : 'text-neo-ink')}>
                      {post.upvotes}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-neo-ink" title="Comments">
                    <MessageSquare size={18} strokeWidth={2.5} />
                    <span className="text-base font-heading font-black">{post.comments?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neo-ink/50" title="Views">
                    <Eye size={18} strokeWidth={2.5} />
                    <span className="text-sm font-heading font-black">{post.view_count}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
