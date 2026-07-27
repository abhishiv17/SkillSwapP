'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { StatCard } from '@/components/dashboard/ui/StatCard';
import { useUser } from '@/hooks/useUser';
import { Coins, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';

export function StatsOverview() {
  const { user, profile } = useUser();
  const [sessionCounts, setSessionCounts] = useState({ upcoming: 0, completed: 0 });
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('status')
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`);

      if (sessions) {
        setSessionCounts({
          upcoming: sessions.filter((s) => s.status === 'active' || s.status === 'pending').length,
          completed: sessions.filter((s) => s.status === 'completed').length,
        });
      }
    };
    fetchCounts();
  }, [user, supabase]);

  const stats = [
    {
      title: 'Skill Credits',
      value: profile?.credits ?? 0,
      icon: Coins,
      color: 'yellow' as const,
      href: ROUTES.dashboard,
    },
    {
      title: 'Sessions Done',
      value: sessionCounts.completed,
      icon: BookOpen,
      color: 'purple' as const,
      href: ROUTES.sessions,
    },
    {
      title: 'Upcoming',
      value: sessionCounts.upcoming,
      icon: GraduationCap,
      color: 'green' as const,
      href: ROUTES.sessions,
    },
    {
      title: 'Rating',
      value: profile?.average_rating ? profile.average_rating.toFixed(1) : '0.0',
      icon: TrendingUp,
      color: 'cream' as const,
      href: ROUTES.reviews,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Link href={stat.href} key={stat.title} className="block ss-button-press">
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            className="h-full border-[3px]"
          />
        </Link>
      ))}
    </div>
  );
}
