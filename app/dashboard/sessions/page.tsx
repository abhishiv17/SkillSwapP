'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/ui/PageHeader';
import { MatchesView } from '@/components/dashboard/sessions/MatchesView';
import { SessionsView } from '@/components/dashboard/sessions/SessionsView';
import { CalendarView } from '@/components/dashboard/sessions/CalendarView';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function SessionsModule() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const view = searchParams.get('view') || 'sessions';

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-page-in">
      <div>
        <PageHeader 
          title="SESSIONS"
          subtitle="Find matches, manage skill swaps, and organize your schedule."
        />

        <div className="flex flex-wrap items-center gap-3 mt-6 pb-6 border-b-[3px] border-neo-ink">
          {[
            { id: 'matches', label: 'MATCHES' },
            { id: 'sessions', label: 'SESSIONS' },
            { id: 'calendar', label: 'CALENDAR' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => router.push(`/dashboard/sessions?view=${tab.id}`)}
              className={cn(
                'px-5 py-3 font-heading font-black text-sm md:text-base uppercase tracking-widest border-[3px] transition-all',
                view === tab.id
                  ? 'bg-neo-purple text-white border-neo-ink shadow-[4px_4px_0_#111111] translate-x-[-2px] translate-y-[-2px]'
                  : 'bg-neo-cream text-neo-ink border-neo-ink hover:bg-neo-yellow hover:shadow-[4px_4px_0_#111111] hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[2px_2px_0_#111111]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {view === 'matches' && <MatchesView />}
        {view === 'sessions' && <SessionsView />}
        {view === 'calendar' && <CalendarView />}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin text-neo-purple" />
      </div>
    }>
      <SessionsModule />
    </Suspense>
  );
}
