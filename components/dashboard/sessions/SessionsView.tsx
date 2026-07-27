'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  Coins,
  Video,
  CheckCircle2,
  Loader2,
  Check,
  X,
  Trash2,
  Sparkles,
  Users,
  Zap,
  PhoneCall,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/dashboard/ui/Button';
import { EmptyState } from '@/components/dashboard/ui/EmptyState';

interface SessionRow {
  id: string;
  teacher_id: string;
  learner_id: string;
  status: string;
  created_at: string;
  ended_at: string | null;
}

interface ProfileMap {
  [id: string]: { username: string };
}

const statusStyles: Record<string, string> = {
  pending: 'bg-neo-yellow text-neo-ink border-[2px] border-neo-ink',
  active: 'bg-neo-green text-neo-ink border-[2px] border-neo-ink',
  completed: 'bg-neo-purple text-white border-[2px] border-neo-ink',
  rejected: 'bg-neo-coral text-neo-ink border-[2px] border-neo-ink',
  cancelled: 'bg-white text-neo-ink/60 border-[2px] border-neo-ink border-dashed',
};

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'JUST NOW';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  const days = Math.floor(hrs / 24);
  return `${days}D AGO`;
}

export function SessionsView() {
  const { user } = useUser();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['sessions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .or(`teacher_id.eq.${user!.id},learner_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load sessions');
        throw error;
      }

      let profileMap: ProfileMap = {};
      if (data && data.length > 0) {
        const peerIds = Array.from(new Set(
          data.flatMap((s) => [s.teacher_id, s.learner_id]).filter((id) => id !== user!.id)
        ));
        if (peerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', peerIds);
          profilesData?.forEach((p) => { profileMap[p.id] = { username: p.username }; });
        }
      }
      return { sessions: (data || []) as SessionRow[], profiles: profileMap };
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('session-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `teacher_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['sessions', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `learner_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['sessions', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, queryClient]);

  async function handleUpdateStatus(sessionId: string, newStatus: string, peerId: string, isAccepting: boolean = false) {
    try {
      const res = await fetch('/api/sessions/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status: newStatus })
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to update session');
      }
      if (isAccepting) {
        const myProfile = await supabase.from('profiles').select('username').eq('id', user!.id).single();
        await supabase.from('notifications').insert({
          user_id: peerId,
          type: 'session_accepted',
          title: 'Session Accepted!',
          message: `${myProfile.data?.username || 'Your peer'} accepted your session request.`,
          link: '/dashboard/sessions',
        });
      }
      toast.success(`Session ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['sessions', user?.id] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update session');
    }
  }

  async function handleCreateTestSession() {
    if (!user) return;
    setIsCreatingTest(true);
    try {
      const { data: otherUser, error: peerErr } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id)
        .limit(1)
        .single();

      if (peerErr || !otherUser) {
        toast.error('Could not find another user to test with.');
        setIsCreatingTest(false);
        return;
      }

      const { data: session, error } = await supabase
        .from('sessions')
        .insert({ teacher_id: user.id, learner_id: otherUser.id, status: 'active' })
        .select()
        .single();

      if (error) throw error;
      toast.success('Test session created! Redirecting...');
      router.push(`/dashboard/sessions/${session.id}`);
    } catch (err: any) {
      toast.error('Failed to create test session');
      setIsCreatingTest(false);
    }
  }

  async function handleDelete(sessionId: string, peerId: string) {
    await handleUpdateStatus(sessionId, 'cancelled', peerId);
  }

  const sessions = data?.sessions || [];
  const profiles = data?.profiles || {};

  const pending = sessions.filter((s) => s.status === 'pending');
  const active = sessions.filter((s) => s.status === 'active');
  const completed = sessions.filter((s) => s.status === 'completed' || s.status === 'rejected');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-xl bg-neo-purple border-[4px] border-neo-ink flex items-center justify-center animate-spin">
          <Loader2 size={24} strokeWidth={3} className="text-white" />
        </div>
        <p className="font-heading font-bold uppercase tracking-widest text-neo-ink">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex justify-end gap-3 -mt-6 mb-2">
        <Button
          variant="secondary"
          size="md"
          onClick={handleCreateTestSession}
          disabled={isCreatingTest}
          icon={<PhoneCall size={18} strokeWidth={2.5} />}
        >
          Test Video Call
        </Button>
        <Button 
          variant="primary" 
          size="md" 
          icon={<Sparkles size={18} strokeWidth={2.5} />}
          onClick={() => router.push('/dashboard/sessions?view=matches')}
        >
          Find Matches
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: active.length, icon: Zap, bg: 'bg-neo-green', color: 'text-neo-ink' },
          { label: 'Pending', value: pending.length, icon: Clock, bg: 'bg-neo-yellow', color: 'text-neo-ink' },
          { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length, icon: CheckCircle2, bg: 'bg-neo-purple', color: 'text-white' },
          { label: 'Total', value: sessions.length, icon: Users, bg: 'bg-white', color: 'text-neo-ink' },
        ].map((stat) => (
          <div key={stat.label} className="ss-card p-4 flex items-center gap-4 border-[3px]">
            <div className={cn('w-12 h-12 rounded-md border-2 border-neo-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0_#111111]', stat.bg)}>
              <stat.icon size={20} strokeWidth={2.5} className={stat.color} />
            </div>
            <div>
              <p className="text-3xl font-heading font-black text-neo-ink leading-none">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Sessions */}
      {active.length > 0 && (
        <div>
          <h2 className="font-heading font-black text-2xl uppercase tracking-tight mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-neo-green border-2 border-neo-ink flex items-center justify-center">
              <Zap size={16} strokeWidth={3} className="text-neo-ink" />
            </span>
            Ready to Join
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {active.map((session) => {
              const isTeaching = session.teacher_id === user!.id;
              const peerId = isTeaching ? session.learner_id : session.teacher_id;
              const peerName = profiles[peerId]?.username || 'Unknown';
              const peerAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${peerName}&backgroundColor=FFF9E9`;

              return (
                <div key={session.id} className="ss-card border-[3px] flex flex-col md:flex-row overflow-hidden group">
                  <div className="p-5 flex-1 flex items-center gap-4 relative">
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neo-green/10 rounded-bl-[100px] pointer-events-none" />

                    <div className="relative">
                      <Image src={peerAvatar} alt={peerName} width={56} height={56} className="w-14 h-14 rounded-md border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111]" />
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-md bg-neo-green border-2 border-neo-ink flex items-center justify-center shadow-[1px_1px_0_#111111]">
                        <Video size={10} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border border-neo-ink', isTeaching ? 'bg-neo-purple text-white' : 'bg-neo-yellow text-neo-ink')}>
                          {isTeaching ? 'TEACHING' : 'LEARNING'}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm bg-neo-green text-neo-ink border border-neo-ink flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-neo-ink animate-pulse" />
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-lg font-heading font-black text-neo-ink uppercase tracking-tight truncate">
                        With {peerName}
                      </p>
                      <p className="text-[10px] font-bold opacity-60 uppercase flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><Clock size={12} strokeWidth={2.5} /> {timeAgo(session.created_at)}</span>
                        <span className="flex items-center gap-1 text-neo-ink"><Coins size={12} strokeWidth={2.5} className="text-neo-yellow" /> 1 CREDIT</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col border-t-[3px] md:border-t-0 md:border-l-[3px] border-neo-ink bg-neo-cream md:w-[160px] shrink-0">
                    <Link
                      href={`/dashboard/sessions/${session.id}`}
                      className="flex-1 flex flex-col items-center justify-center p-4 bg-neo-purple hover:bg-neo-purple/90 text-white font-heading font-bold uppercase tracking-widest text-xs transition-colors border-b-[3px] border-neo-ink"
                    >
                      <PhoneCall size={20} strokeWidth={2.5} className="mb-2" />
                      JOIN CALL
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(session.id, 'cancelled', peerId)}
                      className="h-10 flex items-center justify-center gap-2 hover:bg-neo-coral hover:text-neo-ink transition-colors font-heading font-bold uppercase text-[10px] tracking-widest"
                    >
                      <X size={14} strokeWidth={3} /> Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Sessions */}
      <div>
        <h2 className="font-heading font-black text-2xl uppercase tracking-tight mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-neo-yellow border-2 border-neo-ink flex items-center justify-center">
            <Calendar size={16} strokeWidth={3} className="text-neo-ink" />
          </span>
          Pending Requests
        </h2>
        
        {pending.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="NO PENDING REQUESTS"
            description="Find matches and request a session to get started!"
            action={
              <Button variant="primary" size="md" onClick={() => router.push('/dashboard/sessions?view=matches')}>
                Find Matches
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((session) => {
              const isTeaching = session.teacher_id === user!.id;
              const peerId = isTeaching ? session.learner_id : session.teacher_id;
              const peerName = profiles[peerId]?.username || 'Unknown';
              const peerAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${peerName}&backgroundColor=FFF9E9`;

              return (
                <div key={session.id} className="ss-card border-[3px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Image src={peerAvatar} alt={peerName} width={48} height={48} className="w-12 h-12 rounded-md border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border border-neo-ink', isTeaching ? 'bg-neo-purple text-white' : 'bg-neo-yellow text-neo-ink')}>
                          {isTeaching ? 'TEACHING' : 'LEARNING'}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm bg-neo-yellow text-neo-ink border border-neo-ink">
                          ⏳ PENDING
                        </span>
                      </div>
                      <p className="text-sm font-heading font-black uppercase text-neo-ink">
                        {isTeaching ? `${peerName} wants to learn` : `Waiting on ${peerName}`}
                      </p>
                      <p className="text-[10px] font-bold opacity-60 uppercase flex items-center gap-1 mt-1">
                        <Clock size={10} strokeWidth={2.5} /> {timeAgo(session.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full sm:w-auto gap-2">
                    {isTeaching ? (
                      <>
                        <Button variant="success" size="sm" onClick={() => handleUpdateStatus(session.id, 'active', peerId, true)} className="flex-1 sm:flex-none">
                          <Check size={16} strokeWidth={3} /> ACCEPT
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(session.id, 'rejected', peerId)} className="px-2">
                          <X size={16} strokeWidth={3} />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(session.id, peerId)} className="w-full text-xs">
                        <Trash2 size={14} strokeWidth={2.5} /> CANCEL
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed & Past */}
      <div>
        <h2 className="font-heading font-black text-2xl uppercase tracking-tight mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-neo-purple border-2 border-neo-ink flex items-center justify-center">
            <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
          </span>
          Completed &amp; Past
        </h2>
        {completed.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="NO COMPLETED SESSIONS"
            description="Complete your first session for it to appear here."
          />
        ) : (
          <div className="space-y-3">
            {completed.map((session) => {
              const isTeaching = session.teacher_id === user!.id;
              const peerId = isTeaching ? session.learner_id : session.teacher_id;
              const peerName = profiles[peerId]?.username || 'Unknown';
              const peerAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${peerName}&backgroundColor=FFF9E9`;

              return (
                <div key={session.id} className="ss-card border-[3px] p-4 flex items-center justify-between gap-4 bg-white">
                  <div className="flex items-center gap-4">
                    <Image src={peerAvatar} alt={peerName} width={40} height={40} className="w-10 h-10 rounded-md border-2 border-neo-ink bg-neo-cream shrink-0 opacity-80" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border border-neo-ink bg-neo-cream text-neo-ink opacity-70">
                          {isTeaching ? 'TAUGHT' : 'LEARNED'}
                        </span>
                        <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border', statusStyles[session.status] || statusStyles.cancelled)}>
                          {session.status}
                        </span>
                      </div>
                      <p className="text-sm font-heading font-black uppercase text-neo-ink">With {peerName}</p>
                      <div className="flex items-center gap-3 text-[10px] font-bold opacity-60 uppercase mt-1">
                        <span className="flex items-center gap-1"><Clock size={10} strokeWidth={2.5} /> {timeAgo(session.created_at)}</span>
                        {session.status === 'completed' && (
                          <span className="flex items-center gap-1"><Coins size={10} strokeWidth={2.5} className="text-neo-yellow" /> {isTeaching ? '+1' : '-1'} CREDIT</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {session.status === 'completed' && (
                      <Link href={`/dashboard/reviews?sessionId=${session.id}`}>
                        <Button variant="ghost" size="sm">Review</Button>
                      </Link>
                    )}
                    {session.status === 'rejected' && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(session.id, peerId)} className="text-neo-coral hover:text-neo-ink">
                        <Trash2 size={14} strokeWidth={2.5} /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
