'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ALL_SKILLS, SKILL_CATEGORIES } from '@/lib/constants';
import { BookOpen, Users, Star, GraduationCap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AIRecommendations } from '@/components/dashboard/AIRecommendations';

interface SkillsTabProps {
  searchQuery: string;
}

export function SkillsTab({ searchQuery }: SkillsTabProps) {
  const [supabase] = useState(() => createClient());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: skillStats, isLoading } = useQuery({
    queryKey: ['skill-stats'],
    queryFn: async () => {
      const { data: userSkills } = await supabase
        .from('skills')
        .select('skill_name, type, user_id');

      if (!userSkills) return {};

      const stats: Record<string, { teachers: number; learners: number; rating: number; teacherIds: Set<string> }> = {};
      
      userSkills.forEach(s => {
        const name = s.skill_name.toLowerCase();
        if (!stats[name]) {
          stats[name] = { teachers: 0, learners: 0, rating: 0, teacherIds: new Set() };
        }
        if (s.type === 'offered') {
          stats[name].teachers++;
          stats[name].teacherIds.add(s.user_id);
        } else {
          stats[name].learners++;
        }
      });

      const uniqueTeacherIds = Array.from(new Set(Array.from(Object.values(stats)).flatMap(s => Array.from(s.teacherIds))));
      
      if (uniqueTeacherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, average_rating')
          .in('id', uniqueTeacherIds);
          
        const ratingMap = new Map(profiles?.map(p => [p.id, p.average_rating || 0]) || []);
        
        Object.values(stats).forEach(stat => {
          if (stat.teachers > 0) {
            let totalRating = 0;
            let ratingCount = 0;
            stat.teacherIds.forEach(tid => {
              const r = ratingMap.get(tid);
              if (r && r > 0) {
                totalRating += r;
                ratingCount++;
              }
            });
            stat.rating = ratingCount > 0 ? totalRating / ratingCount : 0;
          }
        });
      }

      return stats;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredSkills = ALL_SKILLS.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? skill.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <AIRecommendations />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-5 py-2.5 text-[11px] font-heading font-black uppercase tracking-widest transition-all border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]',
            !selectedCategory
              ? 'bg-neo-purple text-white shadow-none translate-x-[2px] translate-y-[2px]'
              : 'bg-white text-neo-ink hover:bg-neo-yellow'
          )}
        >
          ALL SKILLS
        </button>
        {SKILL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'px-4 py-2.5 text-[11px] font-heading font-black uppercase tracking-widest transition-all flex items-center gap-2 border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]',
              selectedCategory === cat.id
                ? 'bg-neo-purple text-white shadow-none translate-x-[2px] translate-y-[2px]'
                : 'bg-white text-neo-ink hover:bg-neo-yellow'
            )}
          >
            <span className="text-sm leading-none">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={32} className="animate-spin text-neo-purple" />
          <span className="font-heading font-black uppercase tracking-widest text-neo-ink">Loading Skills...</span>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="text-center py-20 ss-card border-[3px] bg-neo-surface shadow-[4px_4px_0_#111111]">
          <BookOpen size={48} strokeWidth={2} className="mx-auto mb-4 text-neo-ink/20" />
          <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-neo-ink mb-2">No skills found</h3>
          <p className="font-bold uppercase tracking-widest text-xs text-neo-ink/60">Try adjusting your search or category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSkills.map(skill => {
            const stats = skillStats?.[skill.name.toLowerCase()] || { teachers: 0, learners: 0, rating: 0 };
            const category = SKILL_CATEGORIES.find(c => c.id === skill.category);
            
            return (
              <div
                key={skill.id}
                className="ss-card border-[3px] bg-white p-5 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] transition-all flex flex-col group relative"
              >
                <div className="absolute top-4 right-4 text-2xl opacity-50 group-hover:opacity-100 transition-opacity group-hover:scale-110">
                  {category?.icon}
                </div>
                
                <div className="mb-4 pr-8">
                  <h3 className="font-heading font-black text-xl text-neo-ink uppercase tracking-tight line-clamp-1 group-hover:text-neo-purple transition-colors">{skill.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-neo-ink/60 mt-1">{category?.label}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="flex flex-col items-center justify-center p-2 rounded-sm bg-neo-green/20 border-[2px] border-neo-ink">
                    <GraduationCap size={16} strokeWidth={2.5} className="text-neo-ink mb-1" />
                    <span className="text-sm font-heading font-black text-neo-ink">{stats.teachers}</span>
                    <span className="text-[9px] text-neo-ink/70 font-bold uppercase tracking-widest">Teachers</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-2 rounded-sm bg-neo-purple/10 border-[2px] border-neo-ink">
                    <Users size={16} strokeWidth={2.5} className="text-neo-ink mb-1" />
                    <span className="text-sm font-heading font-black text-neo-ink">{stats.learners}</span>
                    <span className="text-[9px] text-neo-ink/70 font-bold uppercase tracking-widest">Learners</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-2 rounded-sm bg-neo-yellow/30 border-[2px] border-neo-ink">
                    <Star size={16} strokeWidth={2.5} className="text-neo-ink mb-1" />
                    <span className="text-sm font-heading font-black text-neo-ink">{stats.rating ? stats.rating.toFixed(1) : '—'}</span>
                    <span className="text-[9px] text-neo-ink/70 font-bold uppercase tracking-widest">Rating</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <Link
                    href={`/dashboard?search=${encodeURIComponent(skill.name)}`}
                    className="flex items-center justify-center gap-2 w-full py-3 border-[2px] border-neo-ink bg-white hover:bg-neo-yellow text-neo-ink text-sm font-heading font-black uppercase tracking-widest shadow-[2px_2px_0_#111111] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#111111] transition-all"
                  >
                    Find Matches
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
