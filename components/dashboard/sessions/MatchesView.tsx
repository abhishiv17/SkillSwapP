'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { SkillTag } from '@/components/dashboard/ui/SkillTag';
import { Button } from '@/components/dashboard/ui/Button';
import {
  ArrowRightLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  Users,
  Zap,
  Target,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/dashboard/ui/EmptyState';

interface MatchResult {
  peer_id: string;
  username: string;
  offered_skill: string;
  compatibility_score: number;
  reasoning: string;
}

export function MatchesView() {
  const { skills, profile } = useUser();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestingSession, setRequestingSession] = useState<string | null>(null);
  const [requestedSessions, setRequestedSessions] = useState<Set<string>>(new Set());

  const desiredSkills = skills.filter((s) => s.type === 'desired');
  const offeredSkills = skills.filter((s) => s.type === 'offered');

  async function handleFindMatches() {
    if (desiredSkills.length === 0) {
      toast.error('Add some desired skills in your profile first!');
      return;
    }

    setLoading(true);
    setMatches([]);
    setRequestedSessions(new Set());

    try {
      const allMatches: MatchResult[] = [];

      try {
        const res = await authFetch('/api/ai/match', {
          method: 'POST',
          body: JSON.stringify({ desiredSkills: desiredSkills.map(s => s.skill_name) }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.matches && Array.isArray(data.matches)) {
            allMatches.push(...data.matches);
          }
        } else {
          const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
          toast.error(`Error matching skills: ${errData.error || res.statusText}`);
        }
      } catch (fetchErr) {
        toast.error(`Network error while searching for matches`);
      }

      // Deduplicate
      const seen = new Set<string>();
      const unique = allMatches.filter((m) => {
        const key = `${m.peer_id || m.username}-${m.offered_skill}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      unique.sort((a, b) => b.compatibility_score - a.compatibility_score);
      setMatches(unique);
      setSearched(true);

      if (unique.length > 0) {
        toast.success(`Found ${unique.length} match${unique.length > 1 ? 'es' : ''}!`);
      } else {
        toast.info('No matches found yet.');
      }
    } catch (err) {
      toast.error('Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestSession(match: MatchResult) {
    if (!match.peer_id) {
      toast.error('Unable to identify this user.');
      return;
    }

    const matchKey = `${match.peer_id}-${match.offered_skill}`;
    setRequestingSession(matchKey);

    try {
      const res = await authFetch('/api/sessions/create', {
        method: 'POST',
        body: JSON.stringify({ teacherId: match.peer_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create session');
        return;
      }

      const supabase = createClient();
      await supabase.from('notifications').insert({
        user_id: match.peer_id,
        type: 'session_request',
        title: 'New Session Request!',
        message: `${profile?.username || 'Someone'} wants to learn ${match.offered_skill} from you.`,
        link: '/dashboard/sessions',
      });

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await supabase.from('messages').insert({
        sender_id: profile!.id,
        receiver_id: match.peer_id,
        content: `Hi! I'd like to request a session to learn ${match.offered_skill} from you. Please let me know what day and time works best for you! (My timezone is ${timezone})`
      });

      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: match.peer_id,
          subject: 'New Session Request!',
          message: `${profile?.username || 'Someone'} wants to learn ${match.offered_skill} from you. Login to CodeCarnage to accept the session request.`
        })
      }).catch(console.error);

      toast.success(`Session requested with ${match.username}! They've been notified.`);
      setRequestedSessions((prev) => new Set(prev).add(matchKey));
    } catch (err) {
      toast.error('Something went wrong.');
    } finally {
      setRequestingSession(null);
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Exchange Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Visual Swap Arrow for Desktop */}
        <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-10">
          <div className="w-14 h-14 bg-neo-yellow border-[3px] border-neo-ink rounded-full flex items-center justify-center shadow-[4px_4px_0_#111111]">
            <ArrowRightLeft size={24} strokeWidth={3} className="text-neo-ink" />
          </div>
        </div>

        {/* You Teach */}
        <div className="ss-card border-[3px] p-6 bg-neo-green/10">
          <h2 className="font-heading font-black text-xl text-neo-ink uppercase tracking-tight mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-neo-green border-2 border-neo-ink flex items-center justify-center shrink-0">
              <Zap size={16} strokeWidth={3} className="text-neo-ink" />
            </span>
            You Teach
          </h2>
          <div className="flex flex-wrap gap-2">
            {offeredSkills.length > 0 ? (
              offeredSkills.map((s) => (
                <SkillTag key={s.id} skill={s.skill_name} color="green" />
              ))
            ) : (
              <p className="text-sm font-medium opacity-70">No skills offered yet.</p>
            )}
          </div>
        </div>

        {/* You Want */}
        <div className="ss-card border-[3px] p-6 bg-neo-purple/10">
          <h2 className="font-heading font-black text-xl text-neo-ink uppercase tracking-tight mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-neo-purple border-2 border-neo-ink flex items-center justify-center shrink-0">
              <Target size={16} strokeWidth={3} className="text-white" />
            </span>
            You Want
          </h2>
          <div className="flex flex-wrap gap-2">
            {desiredSkills.length > 0 ? (
              desiredSkills.map((s) => (
                <SkillTag key={s.id} skill={s.skill_name} color="purple" />
              ))
            ) : (
              <p className="text-sm font-medium opacity-70">No desired skills set.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Match Engine Panel */}
      <div className="ss-card border-[3px] p-6 sm:p-8 bg-neo-yellow flex flex-col md:flex-row items-center justify-between gap-6 shadow-[6px_6px_0_#111111]">
        <div>
          <h3 className="font-heading font-black text-2xl uppercase tracking-tight mb-1">AI Match Engine</h3>
          <p className="font-medium opacity-80">Finding students whose skill profiles complement yours.</p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleFindMatches}
          disabled={loading || desiredSkills.length === 0}
          icon={<Sparkles size={20} strokeWidth={2.5} />}
        >
          {loading ? 'Analyzing...' : 'Find Matches'}
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-20 h-20 rounded-xl bg-neo-purple border-[4px] border-neo-ink flex items-center justify-center shadow-[6px_6px_0_#111111] animate-bounce">
            <Sparkles size={32} strokeWidth={2.5} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-xl font-heading font-black text-neo-ink uppercase">
              Analyzing Compatibility
            </p>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && searched && matches.length === 0 && (
        <EmptyState
          icon={Users}
          title="NO MATCHES FOUND"
          description="We couldn't find a perfect match right now. More users joining the platform will improve results."
          action={
            <Link href="/dashboard/campus">
              <Button variant="secondary" size="md">Visit Campus Hub</Button>
            </Link>
          }
        />
      )}

      {/* Match results */}
      {!loading && matches.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-[3px] border-neo-ink pb-4">
            <h3 className="font-heading font-black text-2xl uppercase tracking-tight">Match Results</h3>
            <span className="font-bold text-sm bg-neo-ink text-white px-3 py-1 rounded-sm">
              {matches.length} FOUND
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match, idx) => {
              const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${match.username}&backgroundColor=FFF9E9`;
              const wantedSkill = desiredSkills.find((s) =>
                match.reasoning?.toLowerCase().includes(s.skill_name.toLowerCase())
              )?.skill_name || desiredSkills[0]?.skill_name || '';

              const matchKey = `${match.peer_id}-${match.offered_skill}`;
              const isRequesting = requestingSession === matchKey;
              const isRequested = requestedSessions.has(matchKey);

              const isTopMatch = idx === 0;

              return (
                <div
                  key={`${match.username}-${match.offered_skill}-${idx}`}
                  className={cn(
                    "ss-card border-[3px] flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111]",
                    isTopMatch ? "border-neo-purple shadow-[6px_6px_0_var(--ss-purple)]" : ""
                  )}
                >
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <Image
                          src={avatarUrl}
                          alt={match.username}
                          width={60}
                          height={60}
                          className="w-[60px] h-[60px] rounded-md border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111]"
                        />
                        <div>
                          <span className="font-heading font-black text-xl uppercase tracking-tight block">
                            {match.username}
                          </span>
                          <span className="text-[11px] font-bold opacity-60 uppercase">
                            SkillSwap Student
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-md border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]",
                        match.compatibility_score >= 85 ? "bg-neo-green text-neo-ink" : "bg-neo-yellow text-neo-ink"
                      )}>
                        <span className="font-heading font-black text-sm">{match.compatibility_score}%</span>
                        <span className="text-[10px] font-bold uppercase">MATCH</span>
                      </div>
                    </div>

                    {/* Swap UI */}
                    <div className="flex items-center justify-between p-4 bg-neo-cream border-[2px] border-neo-ink rounded-md mb-4 shadow-[2px_2px_0_#111111]">
                      <div className="flex-1 text-center">
                        <p className="text-[10px] font-bold opacity-60 uppercase mb-2">They Teach</p>
                        <SkillTag skill={match.offered_skill} color="purple" />
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <ArrowRightLeft size={20} strokeWidth={3} className="text-neo-ink" />
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[10px] font-bold opacity-60 uppercase mb-2">You Want</p>
                        <SkillTag skill={wantedSkill} color="yellow" />
                      </div>
                    </div>

                    {/* Reasoning */}
                    <p className="text-sm font-medium leading-relaxed opacity-80 mb-6 flex-1">
                      {match.reasoning}
                    </p>
                  </div>

                  {/* Footer / CTA */}
                  <div className="p-4 border-t-[3px] border-neo-ink bg-neo-surface">
                    {isRequested ? (
                      <div className="flex items-center justify-center gap-2 h-11 rounded-md bg-neo-green border-[2px] border-neo-ink text-neo-ink font-heading font-bold uppercase tracking-widest shadow-[2px_2px_0_#111111]">
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                        Session Requested
                      </div>
                    ) : (
                      <Button
                        variant={isTopMatch ? "primary" : "secondary"}
                        size="md"
                        className="w-full text-sm"
                        disabled={isRequesting}
                        onClick={() => handleRequestSession(match)}
                        icon={isRequesting ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} strokeWidth={2.5} />}
                      >
                        {isRequesting ? 'Sending...' : 'Request Session'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
