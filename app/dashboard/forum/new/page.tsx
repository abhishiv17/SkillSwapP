'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { GlassCard } from '@/components/shared/GlassCard';
import { MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'help', label: 'Q&A / Help' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'discussion', label: 'Discussion' },
];

export default function NewForumPostPage() {
  const router = useRouter();
  const { user } = useUser();
  const [supabase] = useState(() => createClient());

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('You must be logged in to post');
    if (!title.trim() || !content.trim()) return toast.error('Title and content are required');

    setIsSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Discussion created!');
      router.push(`/dashboard/campus/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create post');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-page-in">
      {/* Header */}
      <div>
        <Link 
          href="/dashboard/campus" 
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-accent-violet transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Forum
        </Link>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <MessageCircle className="text-accent-violet" />
          Start a New Discussion
        </h1>
      </div>

      <GlassCard padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Title</label>
            <input
              type="text"
              placeholder="What do you want to discuss?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-accent-violet/50 transition-colors"
              required
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    category === cat.id
                      ? 'bg-accent-violet/15 border-accent-violet/30 text-accent-violet'
                      : 'bg-[var(--bg-surface-solid)] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Details</label>
            <textarea
              placeholder="Provide more context, details, or ask your question..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-accent-violet/50 transition-colors resize-none"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Tags <span className="text-xs font-normal text-[var(--text-muted)]">(comma separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. react, interview, help"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-accent-violet/50 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
            <Link 
              href="/dashboard/campus"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent-violet text-white rounded-xl text-sm font-semibold shadow-lg shadow-accent-violet/25 hover:shadow-accent-violet/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              Post Discussion
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
