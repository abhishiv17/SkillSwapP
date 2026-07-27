'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/dashboard/ui/PageHeader';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Flame,
  Loader2,
  GraduationCap,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LeaderboardEntry {
  id: string;
  username: string;
  full_name: string | null;
  college_name: string | null;
  city: string | null;
  credits: number;
  average_rating: number;
  total_sessions: number;
}

const podiumColors = [
  {
    bg: 'bg-neo-yellow',
    text: 'text-neo-ink',
    icon: Crown,
    label: '1ST PLACE',
  },
  {
    bg: 'bg-white',
    text: 'text-neo-ink',
    icon: Medal,
    label: '2ND PLACE',
  },
  {
    bg: 'bg-neo-coral',
    text: 'text-white',
    icon: Medal,
    label: '3RD PLACE',
  },
];

export default function LeaderboardPage() {
  const [supabase] = useState(() => createClient());

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, college_name, city, credits, average_rating, total_sessions')
        .order('total_sessions', { ascending: false })
        .order('average_rating', { ascending: false })
        .order('credits', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to fetch leaderboard:', error);
        toast.error('Failed to load leaderboard');
        throw error;
      }
      return (data || []) as LeaderboardEntry[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin text-neo-purple" />
        <span className="font-heading font-black uppercase tracking-widest text-neo-ink">Loading Leaderboard...</span>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 animate-page-in">
      {/* Header */}
      <PageHeader 
        title="Leaderboard"
        subtitle="Top contributors on the platform — ranked by sessions, rating, and credits"
      />

      {/* Podium — Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-16 pt-8">
          {/* Display order: 2nd, 1st, 3rd for podium effect on desktop */}
          {[top3[1], top3[0], top3[2]].map((entry, visualIdx) => {
            if (!entry) return null;
            const actualRank = visualIdx === 1 ? 0 : visualIdx === 0 ? 1 : 2;
            const style = podiumColors[actualRank];
            const Icon = style.icon;
            const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${entry.username}&backgroundColor=FFF9E9`;

            return (
              <div
                key={entry.id}
                className={cn(
                  'ss-card relative flex flex-col items-center text-center p-6 border-[4px]',
                  style.bg,
                  actualRank === 0 ? 'md:-translate-y-8 z-10 shadow-[8px_8px_0_#111111]' : 'shadow-[4px_4px_0_#111111]'
                )}
              >
                {/* Rank badge */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-2 border-[3px] border-neo-ink bg-white flex items-center gap-2 shadow-[2px_2px_0_#111111]">
                  <Icon size={18} strokeWidth={3} className={style.text !== 'text-white' ? style.text : 'text-neo-coral'} />
                  <span className="text-xs font-heading font-black text-neo-ink">
                    {style.label}
                  </span>
                </div>

                {/* Avatar */}
                <div className="w-24 h-24 border-[3px] border-neo-ink bg-white shadow-[4px_4px_0_#111111] mb-6 mt-4 p-1">
                  <Image
                    src={avatarUrl}
                    alt={entry.username || 'User avatar'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover border-[2px] border-neo-ink"
                  />
                </div>

                {/* Name */}
                <h3 className={cn("font-heading font-black text-2xl uppercase tracking-tight mb-1", style.text)}>
                  {entry.full_name || entry.username}
                </h3>
                <p className={cn("text-xs font-bold uppercase tracking-widest mb-6", style.text === 'text-white' ? 'text-white/80' : 'text-neo-ink/70')}>
                  @{entry.username}
                  {entry.college_name && ` · ${entry.college_name}`}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-center gap-4 text-xs w-full">
                  <div className={cn("flex flex-col items-center gap-1 p-2 flex-1 border-[2px]", style.text === 'text-white' ? 'bg-neo-ink/10 border-white/20' : 'bg-white border-neo-ink')}>
                    <span className={cn("flex items-center gap-1 font-heading font-black text-lg", style.text === 'text-white' ? 'text-white' : 'text-neo-coral')}>
                      <Flame size={16} strokeWidth={3} />
                      {entry.total_sessions}
                    </span>
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", style.text === 'text-white' ? 'text-white/80' : 'text-neo-ink')}>SESSIONS</span>
                  </div>
                  
                  <div className={cn("flex flex-col items-center gap-1 p-2 flex-1 border-[2px]", style.text === 'text-white' ? 'bg-neo-ink/10 border-white/20' : 'bg-white border-neo-ink')}>
                    <span className={cn("flex items-center gap-1 font-heading font-black text-lg", style.text === 'text-white' ? 'text-white' : 'text-neo-yellow')}>
                      <Star size={16} strokeWidth={3} />
                      {Number(entry.average_rating).toFixed(1)}
                    </span>
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", style.text === 'text-white' ? 'text-white/80' : 'text-neo-ink')}>RATING</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full ranked table */}
      {rest.length > 0 && (
        <div className="ss-card border-[4px] bg-white shadow-[8px_8px_0_#111111] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[4px] border-neo-ink bg-neo-purple">
                  <th className="px-6 py-4 text-[11px] font-heading font-black text-white uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-4 text-[11px] font-heading font-black text-white uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-[11px] font-heading font-black text-white uppercase tracking-widest hidden md:table-cell">College</th>
                  <th className="px-6 py-4 text-[11px] font-heading font-black text-white uppercase tracking-widest text-center">Sessions</th>
                  <th className="px-6 py-4 text-[11px] font-heading font-black text-white uppercase tracking-widest text-center">Rating</th>
                  <th className="px-6 py-4 text-[11px] font-heading font-black text-white uppercase tracking-widest text-center">Credits</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((entry, idx) => {
                  const rank = idx + 4;
                  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${entry.username}&backgroundColor=FFF9E9`;

                  return (
                    <tr
                      key={entry.id}
                      className="border-b-[2px] border-neo-ink/20 last:border-0 hover:bg-neo-yellow/20 transition-colors"
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <span className="font-heading font-black text-xl text-neo-ink/40">#{rank}</span>
                      </td>

                      {/* Student */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Image
                            src={avatarUrl}
                            alt={entry.username || 'User avatar'}
                            width={40}
                            height={40}
                            className="w-10 h-10 border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111]"
                          />
                          <div>
                            <p className="font-heading font-black text-sm uppercase tracking-tight text-neo-ink leading-none mb-1">
                              {entry.full_name || entry.username}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neo-ink/60">@{entry.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* College */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-neo-ink/80 flex items-center gap-2">
                          <GraduationCap size={14} strokeWidth={3} className="text-neo-ink" />
                          {entry.college_name || '—'}
                        </span>
                      </td>

                      {/* Sessions */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-coral/10 border-[2px] border-neo-coral/30 text-neo-coral font-heading font-black text-sm">
                          <Flame size={14} strokeWidth={3} />
                          {entry.total_sessions}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-yellow/20 border-[2px] border-neo-yellow/50 text-neo-ink font-heading font-black text-sm">
                          <Star size={14} strokeWidth={3} className="text-neo-yellow fill-neo-yellow" />
                          {Number(entry.average_rating).toFixed(1)}
                        </span>
                      </td>

                      {/* Credits */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-heading font-black text-neo-green drop-shadow-sm">
                          {entry.credits}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-24 ss-card border-[3px] bg-white shadow-[4px_4px_0_#111111]">
          <Trophy size={48} strokeWidth={2} className="mx-auto mb-6 text-neo-ink/20" />
          <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-neo-ink mb-2">No students yet</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-neo-ink/60">
            Be the first to complete a session and climb the leaderboard!
          </p>
        </div>
      )}
    </div>
  );
}
