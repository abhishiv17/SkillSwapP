'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Library, Plus, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillsTab } from '@/components/dashboard/library/SkillsTab';
import { ResourcesTab, RESOURCE_TYPES } from '@/components/dashboard/library/ResourcesTab';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { SKILL_CATEGORIES } from '@/lib/constants';
import { PageHeader } from '@/components/dashboard/ui/PageHeader';
import { Tabs } from '@/components/dashboard/ui/Tabs';
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

export default function LibraryPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('skills');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states for Resources
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    url: '',
    resource_type: 'article',
    category: 'programming',
    tags: '',
  });

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to share resources');
    
    const supabase = createClient();
    try {
      const { error } = await supabase.from('resources').insert({
        uploader_id: user.id,
        ...newResource,
        tags: newResource.tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      if (error) throw error;
      
      toast.success('Resource shared successfully!');
      setIsAddModalOpen(false);
      setNewResource({
        title: '',
        description: '',
        url: '',
        resource_type: 'article',
        category: 'programming',
        tags: '',
      });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    } catch (err) {
      toast.error('Failed to share resource');
    }
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingResource) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('resources')
        .update({
          title: editingResource.title,
          description: editingResource.description,
          url: editingResource.url,
          resource_type: editingResource.resource_type,
          category: editingResource.category,
          tags: Array.isArray(editingResource.tags) 
            ? editingResource.tags 
            : (editingResource.tags as string).split(',').map(t => t.trim()).filter(Boolean),
        })
        .eq('id', editingResource.id)
        .eq('uploader_id', user.id);

      if (error) throw error;

      toast.success('Resource updated successfully!');
      setEditingResource(null);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    } catch (err) {
      toast.error('Failed to update resource');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-page-in">
      {/* Header */}
      <PageHeader 
        title="Library"
        subtitle="Explore skills, demand, and curated learning materials."
      />

      {/* Unified Search & Action */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-neo-purple border-[3px] border-neo-ink p-4 shadow-[4px_4px_0_#111111]">
        <Tabs 
          tabs={[
            { id: 'skills', label: 'Skills' },
            { id: 'resources', label: 'Resources' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="w-full lg:w-auto shadow-[2px_2px_0_#111111]"
        />

        <div className="relative w-full flex-1">
          <Search size={20} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
          <input
            type="text"
            placeholder={activeTab === 'skills' ? "SEARCH SKILLS..." : "SEARCH RESOURCES..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-[44px] rounded-sm bg-white border-[2px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/50 focus:outline-none focus:ring-0 focus:border-neo-yellow focus:shadow-[2px_2px_0_var(--ss-yellow)] transition-all uppercase tracking-widest"
          />
        </div>
        
        {activeTab === 'resources' && (
          <Button 
            variant="primary" 
            size="md" 
            icon={<Plus size={18} strokeWidth={3} />}
            onClick={() => setIsAddModalOpen(true)}
            className="w-full lg:w-auto shrink-0"
          >
            Share Resource
          </Button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'skills' ? (
          <SkillsTab searchQuery={searchQuery} />
        ) : (
          <ResourcesTab searchQuery={searchQuery} setEditingResource={setEditingResource} />
        )}
      </div>

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neo-ink/80 backdrop-blur-sm animate-fade-in">
          <div className="ss-card border-[3px] bg-neo-cream p-6 w-full max-w-lg shadow-[8px_8px_0_#111111] animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-[3px] border-neo-ink pb-4 mb-6">
              <h2 className="font-heading font-black text-2xl uppercase tracking-tight text-neo-ink flex items-center gap-3">
                <span className="w-8 h-8 rounded-md bg-neo-purple border-2 border-neo-ink flex items-center justify-center shadow-[2px_2px_0_#111111]">
                  <Plus size={20} strokeWidth={3} className="text-white" />
                </span>
                Share Resource
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-neo-ink hover:bg-neo-coral text-neo-ink transition-colors"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleAddResource} className="space-y-5">
              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.G. MASTER REACT IN 10 MINUTES"
                  value={newResource.title}
                  onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                  className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Type</label>
                  <select
                    value={newResource.resource_type}
                    onChange={(e) => setNewResource({...newResource, resource_type: e.target.value as any})}
                    className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase cursor-pointer appearance-none"
                  >
                    {RESOURCE_TYPES.filter(t => t.id !== 'all').map(t => (
                      <option key={t.id} value={t.id}>{t.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Category</label>
                  <select
                    value={newResource.category}
                    onChange={(e) => setNewResource({...newResource, category: e.target.value})}
                    className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase cursor-pointer appearance-none"
                  >
                    {SKILL_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Resource URL</label>
                <input
                  type="url"
                  required
                  placeholder="HTTPS://EXAMPLE.COM/RESOURCE"
                  value={newResource.url}
                  onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                  className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Description</label>
                <textarea
                  placeholder="WHAT IS THIS RESOURCE ABOUT? WHY IS IT HELPFUL?"
                  value={newResource.description}
                  onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                  rows={3}
                  className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-medium text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="E.G. REACT, HOOKS, FRONTEND"
                  value={newResource.tags}
                  onChange={(e) => setNewResource({...newResource, tags: e.target.value})}
                  className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-[3px] border-neo-ink">
                <Button variant="ghost" size="md" onClick={() => setIsAddModalOpen(false)}>
                  CANCEL
                </Button>
                <Button type="submit" variant="primary" size="md">
                  SHARE RESOURCE
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neo-ink/80 backdrop-blur-sm animate-fade-in">
          <div className="ss-card border-[3px] bg-neo-cream p-6 w-full max-w-lg shadow-[8px_8px_0_#111111] animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-[3px] border-neo-ink pb-4 mb-6">
              <h2 className="font-heading font-black text-2xl uppercase tracking-tight text-neo-ink flex items-center gap-3">
                <span className="w-8 h-8 rounded-md bg-neo-yellow border-2 border-neo-ink flex items-center justify-center shadow-[2px_2px_0_#111111]">
                  <Edit2 size={20} strokeWidth={3} className="text-neo-ink" />
                </span>
                Edit Resource
              </h2>
              <button 
                onClick={() => setEditingResource(null)}
                className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-neo-ink hover:bg-neo-coral text-neo-ink transition-colors"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateResource} className="space-y-5">
              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.G. MASTER REACT IN 10 MINUTES"
                  value={editingResource.title}
                  onChange={(e) => setEditingResource({...editingResource, title: e.target.value})}
                  className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Type</label>
                  <select
                    value={editingResource.resource_type}
                    onChange={(e) => setEditingResource({...editingResource, resource_type: e.target.value as any})}
                    className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase cursor-pointer appearance-none"
                  >
                    {RESOURCE_TYPES.filter(t => t.id !== 'all').map(t => (
                      <option key={t.id} value={t.id}>{t.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Category</label>
                  <select
                    value={editingResource.category}
                    onChange={(e) => setEditingResource({...editingResource, category: e.target.value})}
                    className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase cursor-pointer appearance-none"
                  >
                    {SKILL_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Resource URL</label>
                <input
                  type="url"
                  required
                  placeholder="HTTPS://EXAMPLE.COM/RESOURCE"
                  value={editingResource.url}
                  onChange={(e) => setEditingResource({...editingResource, url: e.target.value})}
                  className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Description</label>
                <textarea
                  placeholder="WHAT IS THIS RESOURCE ABOUT? WHY IS IT HELPFUL?"
                  value={editingResource.description}
                  onChange={(e) => setEditingResource({...editingResource, description: e.target.value})}
                  rows={3}
                  className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-medium text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="E.G. REACT, HOOKS, FRONTEND"
                  value={Array.isArray(editingResource.tags) ? editingResource.tags.join(', ') : editingResource.tags}
                  onChange={(e) => setEditingResource({...editingResource, tags: e.target.value as any})}
                  className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-[3px] border-neo-ink">
                <Button variant="ghost" size="md" onClick={() => setEditingResource(null)}>
                  CANCEL
                </Button>
                <Button type="submit" variant="primary" size="md">
                  SAVE CHANGES
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
