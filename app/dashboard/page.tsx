'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useQuery } from '@tanstack/react-query';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { SkillCard } from '@/components/dashboard/SkillCard';
import type { MarketplaceListing } from '@/types/marketplace';
import { Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PageHeader } from '@/components/dashboard/ui/PageHeader';
import { EmptyState } from '@/components/dashboard/ui/EmptyState';
import { ArrowRightLeft } from 'lucide-react';

function DashboardContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [supabase] = useState(() => createClient());

  const { data: listings = [], isLoading: loading } = useQuery({
    queryKey: ['marketplace-listings', user?.id],
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data: skills } = await supabase
        .from('skills')
        .select('user_id, skill_name')
        .eq('type', 'offered')
        .neq('user_id', user!.id);

      if (!skills || skills.length === 0) return [];

      const userIds = Array.from(new Set(skills.map((s) => s.user_id)));

      // Parallelize profiles + desired skills fetch
      const [{ data: profiles }, { data: desiredSkills }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, college_name, year_of_study, bio, credits, total_sessions, average_rating, created_at, preferred_mode')
          .in('id', userIds),
        supabase
          .from('skills')
          .select('user_id, skill_name')
          .eq('type', 'desired')
          .in('user_id', userIds),
      ]);

      return skills.map((skill, idx) => {
        const profile = profiles?.find((p) => p.id === skill.user_id);
        const wantedSkill = desiredSkills?.find((d) => d.user_id === skill.user_id);
        const avatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${profile?.username || 'User'}&backgroundColor=FFF9E9`;

        const collegeName = profile?.college_name || 'SkillSwap Student';
        const yearStr = profile?.year_of_study ? `Year ${profile.year_of_study}` : '';
        const bioText = profile?.bio || '';

        return {
          id: `listing-${idx}`,
          user: {
            id: skill.user_id,
            name: profile?.full_name || profile?.username || 'Unknown',
            avatar,
            college: collegeName,
            year: yearStr,
            bio: bioText,
            skillsHave: [skill.skill_name],
            skillsWant: wantedSkill ? [wantedSkill.skill_name] : [],
            credits: profile?.credits ?? 0,
            sessionsCompleted: profile?.total_sessions ?? 0,
            rating: profile?.average_rating ?? 0,
            reviewCount: 0,
            isVerified: true,
            joinedAt: profile?.created_at || '',
          },
          skillOffered: skill.skill_name,
          skillWanted: wantedSkill?.skill_name || 'Any skill',
          description: bioText || `${profile?.full_name || profile?.username || 'A student'} is offering to teach ${skill.skill_name}. Connect to start swapping skills!`,
          creditsPerHour: 1,
          availability: profile?.preferred_mode === 'online' ? 'Online' : profile?.preferred_mode === 'offline' ? 'Offline' : 'Flexible',
          tags: [skill.skill_name, collegeName].filter(Boolean),
        } as MarketplaceListing;
      });
    },
  });

  return (
    <div className="space-y-12">
      <PageHeader 
        title="Marketplace" 
        subtitle="Find someone who knows what you want to learn — and teach something in return."
      />

      <StatsOverview />

      <div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <h2 className="font-heading font-black text-xl text-neo-ink uppercase tracking-tight">
            Available Swaps
          </h2>
          
          <div className="relative w-full sm:w-[320px]">
            <Search size={18} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
            <input
              type="text"
              placeholder="Search skills or students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-[44px] rounded-md bg-white border-[2px] border-neo-ink text-neo-ink placeholder:text-neo-ink/50 text-sm font-bold focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase tracking-wide"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="ss-card border-[3px] h-[320px] bg-white animate-pulse flex flex-col">
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-neo-ink/10 rounded-md" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-neo-ink/10 rounded w-2/3" />
                      <div className="h-3 bg-neo-ink/10 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="h-8 bg-neo-ink/10 rounded" />
                    <div className="h-8 bg-neo-ink/10 rounded" />
                  </div>
                </div>
                <div className="p-4 border-t-[3px] border-neo-ink bg-neo-cream h-[60px]" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="NO SWAPS HERE YET"
            description="Add the skills you can teach to your profile to start appearing in the marketplace."
          />
        ) : (
          (() => {
            const filteredListings = listings.filter((listing) => {
              const q = searchQuery.toLowerCase();
              return (
                listing.skillOffered.toLowerCase().includes(q) ||
                listing.skillWanted.toLowerCase().includes(q) ||
                listing.user.name.toLowerCase().includes(q) ||
                listing.tags.some(tag => tag.toLowerCase().includes(q))
              );
            });

            if (filteredListings.length === 0) {
              return (
                <EmptyState
                  icon={Search}
                  title="NO MATCHES FOUND"
                  description={`No listings found matching "${searchQuery}".`}
                />
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <SkillCard key={listing.id} listing={listing} />
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-12 animate-pulse">
        <div className="h-32 bg-neo-ink/5 rounded-md border-[3px] border-neo-ink/10" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-neo-ink/5 rounded-md border-[3px] border-neo-ink/10" />)}
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
