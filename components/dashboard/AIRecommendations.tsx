'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { Sparkles, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface Recommendation {
  name: string;
  reason: string;
  type: 'learn' | 'teach';
}

export function AIRecommendations() {
  const { user } = useUser();

  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['ai-recommendations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id }),
      });
      
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const data = await res.json();
      return (data.recommendations || []) as Recommendation[];
    },
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });

  if (error) return null; // Fail silently, it's an optional enhancement

  return (
    <div className="ss-card border-[4px] bg-neo-purple p-6 mb-8 shadow-[8px_8px_0_#111111] overflow-hidden relative text-white">
      {/* Decorative dots background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2px)', backgroundSize: '16px 16px' }} />
      
      <div className="flex items-center gap-3 mb-4 relative z-10 border-b-[3px] border-neo-ink pb-4">
        <div className="w-10 h-10 border-[2px] border-neo-ink bg-neo-yellow flex items-center justify-center shadow-[2px_2px_0_#111111]">
          <Sparkles size={20} strokeWidth={3} className="text-neo-ink" />
        </div>
        <h2 className="font-heading font-black text-2xl uppercase tracking-tight leading-none drop-shadow-[2px_2px_0_#111111]">AI Skill Suggestions</h2>
        <span className="text-[10px] font-bold px-2 py-1 bg-white text-neo-ink border-[2px] border-neo-ink shadow-[2px_2px_0_#111111] uppercase tracking-widest ml-2 hidden sm:inline-block">
          Powered by Llama 3.1
        </span>
      </div>

      <p className="text-sm font-bold uppercase tracking-widest text-white/90 mb-6 relative z-10">
        Based on your profile, background, and current skills, here&apos;s what we think you should explore next.
      </p>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[280px] h-36 border-[3px] border-neo-ink bg-white/10 animate-pulse shrink-0 snap-start" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar relative z-10">
          {recommendations?.map((rec, idx) => (
            <Link
              key={idx}
              href={`/dashboard?search=${encodeURIComponent(rec.name)}`}
              className="group min-w-[280px] max-w-[280px] p-5 border-[3px] border-neo-ink bg-white hover:bg-neo-yellow hover:-translate-y-1 hover:translate-x-1 shadow-[4px_4px_0_#111111] hover:shadow-none transition-all shrink-0 snap-start relative flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-heading font-black text-xl text-neo-ink uppercase tracking-tight pr-8 line-clamp-2 leading-none">{rec.name}</h3>
                <div className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink shadow-[2px_2px_0_#111111] ${
                  rec.type === 'learn' 
                    ? 'bg-neo-coral text-white'
                    : 'bg-neo-green text-neo-ink'
                }`}>
                  {rec.type === 'learn' ? <BookOpen size={16} strokeWidth={3} /> : <GraduationCap size={16} strokeWidth={3} />}
                </div>
              </div>
              
              <p className="text-xs font-bold text-neo-ink/70 mb-4 line-clamp-2 flex-1">
                {rec.reason}
              </p>
              
              <div className="flex items-center gap-2 text-xs font-heading font-black uppercase tracking-widest mt-auto opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-neo-ink">
                Find {rec.type === 'learn' ? 'teachers' : 'learners'} <ArrowRight size={14} strokeWidth={3} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
