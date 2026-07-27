'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BADGES, BADGE_MAP, RARITY_COLORS, MILESTONES } from '@/lib/badges';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Award, TrendingUp, Lock, Sparkles } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export function BadgesSection() {
  const { user, profile, skills } = useUser();
  const [supabase] = useState(() => createClient());

  // Trigger badge check on mount, then fetch results
  const { data: userBadges = [], isLoading } = useQuery({
    queryKey: ['user-badges', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Trigger the check-and-award process
      const res = await authFetch('/api/badges', {
        method: 'POST',
        body: JSON.stringify({ userId: user!.id }),
      });
      const data = await res.json();
      return (data.badges || []) as UserBadge[];
    },
    staleTime: 60 * 1000, // 1 min
  });

  const earnedBadgeIds = new Set(userBadges.map((b) => b.badge_id));
  const earnedBadges = BADGES.filter((b) => earnedBadgeIds.has(b.id));
  const lockedBadges = BADGES.filter((b) => !earnedBadgeIds.has(b.id));

  // Milestones computation
  const offeredSkills = skills.filter((s) => s.type === 'offered');

  const { data: reviewCount = 0 } = useQuery({
    queryKey: ['review-count', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('reviewer_id', user!.id);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const milestoneValues: Record<string, number> = {
    sessions: profile?.total_sessions ?? 0,
    credits: profile?.credits ?? 0,
    reviews: reviewCount,
    skills: offeredSkills.length,
  };

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <div className="ss-card border-[3px] bg-white p-6 shadow-[6px_6px_0_#111111]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-[3px] border-neo-ink">
          <span className="w-8 h-8 flex items-center justify-center bg-neo-yellow border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]">
            <Award size={18} strokeWidth={3} className="text-neo-ink" />
          </span>
          <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink">
            Badges Earned ({earnedBadges.length}/{BADGES.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-20 h-24 bg-neo-surface border-[3px] border-neo-ink shadow-[4px_4px_0_#111111] animate-pulse" />
            ))}
          </div>
        ) : earnedBadges.length === 0 ? (
          <div className="text-center py-8 bg-neo-surface border-[3px] border-neo-ink border-dashed">
            <Sparkles size={32} strokeWidth={2} className="mx-auto mb-3 text-neo-ink/30" />
            <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/60">No badges yet. Complete sessions to earn your first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {earnedBadges.map((badge) => {
              const colors = RARITY_COLORS[badge.rarity];
              const earned = userBadges.find((b) => b.badge_id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    'group relative flex flex-col items-center p-3 bg-white border-[3px] border-neo-ink transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0_#111111] cursor-default',
                    colors.bg && colors.bg.includes('amber') ? 'bg-neo-yellow' : 
                    colors.bg && colors.bg.includes('violet') ? 'bg-neo-purple' : 
                    colors.bg && colors.bg.includes('slate') ? 'bg-neo-surface' : 'bg-neo-green',
                    colors.text && colors.text.includes('white') ? 'text-white' : 'text-neo-ink'
                  )}
                  title={`${badge.name} — ${badge.description}`}
                >
                  <span className="text-2xl mb-2 grayscale-[0.2] drop-shadow-sm">{badge.icon}</span>
                  <span className={cn(
                    "text-[10px] font-heading font-black text-center leading-tight uppercase tracking-tight line-clamp-2",
                    colors.text && colors.text.includes('white') ? 'text-white' : 'text-neo-ink'
                  )}>
                    {badge.name}
                  </span>
                  <span className={cn(
                    'text-[8px] font-bold uppercase tracking-widest mt-1 px-1.5 py-0.5 border-[2px] border-neo-ink bg-white text-neo-ink'
                  )}>
                    {badge.rarity}
                  </span>
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-neo-ink text-white font-bold text-[10px] uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[4px_4px_0_var(--ss-purple)] z-10">
                    {badge.description}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Locked badges preview */}
        {lockedBadges.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-8 mb-4 border-t-[3px] border-neo-ink/20 pt-6">
              <Lock size={16} strokeWidth={3} className="text-neo-ink/50" />
              <span className="text-xs font-bold uppercase tracking-widest text-neo-ink/60">
                {lockedBadges.length} BADGE{lockedBadges.length !== 1 ? 'S' : ''} TO UNLOCK
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="group relative flex flex-col items-center p-3 bg-neo-surface border-[3px] border-neo-ink opacity-60 hover:opacity-100 transition-all cursor-default"
                  title={`${badge.name} — ${badge.description}`}
                >
                  <span className="text-2xl mb-2 grayscale opacity-50">{badge.icon}</span>
                  <span className="text-[9px] font-heading font-black text-neo-ink text-center leading-tight uppercase tracking-tight line-clamp-2">
                    {badge.name}
                  </span>
                  <Lock size={10} strokeWidth={3} className="mt-1 text-neo-ink/40" />
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-neo-ink text-white font-bold text-[10px] uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[4px_4px_0_var(--ss-purple)] z-10">
                    {badge.description}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Milestones */}
      <div className="ss-card border-[3px] bg-white p-6 shadow-[6px_6px_0_#111111]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-[3px] border-neo-ink">
          <span className="w-8 h-8 flex items-center justify-center bg-neo-green border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]">
            <TrendingUp size={18} strokeWidth={3} className="text-neo-ink" />
          </span>
          <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink">
            Milestones
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {MILESTONES.map((milestone) => {
            const value = milestoneValues[milestone.id] ?? 0;
            const nextThreshold = milestone.thresholds.find((t) => t > value) || milestone.thresholds[milestone.thresholds.length - 1];
            const prevThreshold = [...milestone.thresholds].reverse().find((t) => t <= value) || 0;
            const progress = nextThreshold > prevThreshold
              ? Math.min(100, ((value - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
              : 100;
            const completedCount = milestone.thresholds.filter((t) => value >= t).length;
            const allComplete = completedCount === milestone.thresholds.length;

            return (
              <div
                key={milestone.id}
                className={cn(
                  'p-5 border-[3px] border-neo-ink transition-all shadow-[4px_4px_0_#111111]',
                  allComplete ? 'bg-neo-green/20' : 'bg-white'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl mr-1">{milestone.icon}</span>
                    <span className="text-sm font-heading font-black uppercase tracking-tight text-neo-ink">{milestone.label}</span>
                  </div>
                  <span className={cn(
                    'text-sm font-heading font-black',
                    allComplete ? 'text-neo-green' : 'text-neo-ink'
                  )}>
                    {value}/{nextThreshold}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-4 bg-neo-surface border-[2px] border-neo-ink overflow-hidden mb-3 p-[1px]">
                  <div
                    className={cn(
                      'h-full transition-all duration-700 ease-out border-r-[2px] border-neo-ink',
                      allComplete ? 'bg-neo-green' : 'bg-neo-purple'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Threshold dots */}
                <div className="flex items-center gap-1 justify-between px-1">
                  {milestone.thresholds.map((threshold, i) => (
                    <div key={threshold} className="flex items-center gap-1 flex-1">
                      <div
                        className={cn(
                          'w-2 h-2 border-[2px] transition-all shrink-0',
                          value >= threshold
                            ? 'bg-neo-green border-neo-ink scale-125'
                            : 'bg-white border-neo-ink/30'
                        )}
                      />
                      <span className={cn(
                        'text-[8px] font-bold uppercase tracking-widest shrink-0',
                        value >= threshold ? 'text-neo-ink' : 'text-neo-ink/40'
                      )}>
                        {threshold}
                      </span>
                      {i < milestone.thresholds.length - 1 && (
                        <div className="w-full h-[2px] bg-neo-ink/20 mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
