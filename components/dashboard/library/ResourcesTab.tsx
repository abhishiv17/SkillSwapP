'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  Library, 
  Video, 
  FileText, 
  Book, 
  ExternalLink, 
  ThumbsUp, 
  Loader2, 
  Globe,
  Edit2,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { SKILL_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/dashboard/ui/Button';

interface Resource {
  id: string;
  uploader_id: string;
  title: string;
  description: string;
  url: string;
  resource_type: 'video' | 'article' | 'book' | 'course' | 'other';
  category: string;
  tags: string[];
  upvotes: number;
  created_at: string;
  uploader: {
    username: string;
  };
  upvoted_by_me?: boolean;
}

export const RESOURCE_TYPES = [
  { id: 'all', label: 'All Types', icon: Globe },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'article', label: 'Articles', icon: FileText },
  { id: 'book', label: 'Books/E-books', icon: Book },
  { id: 'course', label: 'Courses', icon: ExternalLink },
];

interface ResourcesTabProps {
  searchQuery: string;
  setEditingResource: (resource: Resource | null) => void;
}

export function ResourcesTab({ searchQuery, setEditingResource }: ResourcesTabProps) {
  const { user } = useUser();
  const [supabase] = useState(() => createClient());
  const [activeType, setActiveType] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: resources, isLoading, refetch } = useQuery({
    queryKey: ['resources', activeType, activeCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('resources')
        .select(`
          *,
          uploader:profiles(username)
        `)
        .order('upvotes', { ascending: false });

      if (activeType !== 'all') query = query.eq('resource_type', activeType);
      if (activeCategory !== 'all') query = query.eq('category', activeCategory);
      if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);

      const { data, error } = await query;
      if (error) throw error;

      let upvotedIds = new Set<string>();
      if (user) {
        const { data: upvotes } = await supabase
          .from('resource_upvotes')
          .select('resource_id')
          .eq('user_id', user.id);
        if (upvotes) upvotedIds = new Set(upvotes.map(u => u.resource_id));
      }

      return data.map(r => ({
        ...r,
        upvoted_by_me: upvotedIds.has(r.id)
      })) as Resource[];
    },
  });

  const handleUpvote = async (resourceId: string) => {
    if (!user) return toast.error('Please login to upvote');
    try {
      await supabase.rpc('toggle_resource_upvote', { p_resource_id: resourceId });
      refetch();
    } catch (err) {
      toast.error('Failed to upvote');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
      toast.success('Resource deleted');
      refetch();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={20} strokeWidth={2.5} className="text-neo-coral" />;
      case 'article': return <FileText size={20} strokeWidth={2.5} className="text-neo-blue" />;
      case 'book': return <Book size={20} strokeWidth={2.5} className="text-neo-yellow" />;
      case 'course': return <ExternalLink size={20} strokeWidth={2.5} className="text-neo-green" />;
      default: return <Globe size={20} strokeWidth={2.5} className="text-neo-purple" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex-1">
          {RESOURCE_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-[11px] font-heading font-black uppercase tracking-widest whitespace-nowrap transition-all border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]",
                activeType === type.id
                  ? "bg-neo-purple text-white shadow-none translate-x-[2px] translate-y-[2px]"
                  : "bg-white text-neo-ink hover:bg-neo-yellow"
              )}
            >
              <type.icon size={16} strokeWidth={3} />
              {type.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="appearance-none pl-4 pr-10 h-10 w-full rounded-sm bg-white border-[2px] border-neo-ink text-[11px] font-heading font-black text-neo-ink uppercase tracking-widest focus:outline-none focus:border-neo-purple shadow-[2px_2px_0_#111111] transition-colors cursor-pointer md:w-[200px]"
          >
            <option value="all">ALL CATEGORIES</option>
            {SKILL_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label.toUpperCase()}</option>
            ))}
          </select>
          <ChevronDown size={18} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-neo-ink pointer-events-none" />
        </div>
      </div>

      {/* Resource Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={32} className="animate-spin text-neo-purple" />
          <span className="font-heading font-black uppercase tracking-widest text-neo-ink">Loading Resources...</span>
        </div>
      ) : resources?.length === 0 ? (
        <div className="text-center py-20 ss-card border-[3px] bg-neo-surface shadow-[4px_4px_0_#111111]">
          <Library size={48} strokeWidth={2} className="mx-auto mb-4 text-neo-ink/20" />
          <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-neo-ink mb-2">No resources found</h3>
          <p className="font-bold uppercase tracking-widest text-xs text-neo-ink/60">Try adjusting your filters or be the first to share one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources?.map(resource => (
            <div 
              key={resource.id} 
              className="ss-card border-[3px] bg-white p-6 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] transition-all flex flex-col group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-sm bg-neo-surface border-[2px] border-neo-ink flex items-center justify-center shadow-[2px_2px_0_#111111]">
                  {getTypeIcon(resource.resource_type)}
                </div>
                <div className="flex items-center gap-2">
                  {user?.id === resource.uploader_id && (
                    <div className="flex items-center gap-1 mr-2 bg-neo-cream border-[2px] border-neo-ink rounded-sm p-1 shadow-[2px_2px_0_#111111]">
                      <button 
                        onClick={() => setEditingResource(resource)}
                        className="p-1 hover:bg-neo-yellow text-neo-ink transition-colors"
                        title="Edit Resource"
                      >
                        <Edit2 size={16} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-1 hover:bg-neo-coral hover:text-white text-neo-ink transition-colors"
                        title="Delete Resource"
                      >
                        <Trash2 size={16} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => handleUpvote(resource.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-xs font-heading font-black uppercase tracking-widest transition-all border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]",
                      resource.upvoted_by_me
                        ? "bg-neo-green text-neo-ink shadow-none translate-y-[2px] translate-x-[2px]"
                        : "bg-white text-neo-ink hover:bg-neo-yellow"
                    )}
                  >
                    <ThumbsUp size={16} strokeWidth={3} />
                    {resource.upvotes}
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-bold px-2 py-1 bg-neo-purple text-white border-[2px] border-neo-ink uppercase tracking-widest shadow-[1px_1px_0_#111111]">
                    {resource.category}
                  </span>
                  <span className="text-[10px] font-bold text-neo-ink/60 uppercase tracking-widest">
                    BY @{resource.uploader.username}
                  </span>
                </div>

                <h3 className="font-heading font-black text-xl text-neo-ink mb-2 group-hover:text-neo-purple transition-colors line-clamp-2 uppercase tracking-tight">
                  {resource.title}
                </h3>
                
                <p className="text-sm font-medium text-neo-ink/80 mb-6 line-clamp-3 leading-relaxed">
                  {resource.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {resource.tags.map(tag => (
                    <span key={tag} className="text-[9px] font-bold px-2 py-1 bg-neo-surface text-neo-ink border-[2px] border-neo-ink uppercase tracking-widest">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 border-[2px] border-neo-ink bg-neo-purple hover:bg-neo-purple/90 text-white text-sm font-heading font-black uppercase tracking-widest shadow-[2px_2px_0_#111111] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#111111] transition-all mt-auto"
              >
                OPEN RESOURCE
                <ExternalLink size={16} strokeWidth={3} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
