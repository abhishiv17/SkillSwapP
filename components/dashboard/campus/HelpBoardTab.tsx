'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/dashboard/ui/Button';
import { EmptyState } from '@/components/dashboard/ui/EmptyState';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  HelpCircle,
  Clock,
  Plus,
  Coins,
  Trash2,
  Send,
  Loader2,
  Users,
  Flame,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'JUST NOW';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

interface HelpBoardTabProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
}

export function HelpBoardTab({ showForm, setShowForm }: HelpBoardTabProps) {
  const { profile } = useUser();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpingId, setHelpingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [credits, setCredits] = useState(1);

  const fetchRequests = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('help_requests')
      .select('*, profiles(id, username)')
      .order('created_at', { ascending: false });
      
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'help_requests' },
        () => { fetchRequests(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error('Must be logged in');
    if (!title || !description) return toast.error('Please fill out all fields');
    if (credits < 1) return toast.error('Credits must be at least 1');

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('help_requests').insert({
      user_id: profile.id,
      title,
      description,
      credits_offered: credits
    });

    if (error) {
      toast.error('Failed to post request');
    } else {
      toast.success('Help request posted!');
      setShowForm(false);
      setTitle('');
      setDescription('');
      setCredits(1);
      fetchRequests();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!profile) return;
    const supabase = createClient();
    const { error } = await supabase.from('help_requests').delete().eq('id', id).eq('user_id', profile.id);
    if (error) {
      toast.error('Failed to delete request');
    } else {
      toast.success('Request deleted');
      setRequests(reqs => reqs.filter(r => r.id !== id));
    }
  };

  const handleHelp = async (req: any) => {
    if (!profile || req.user_id === profile.id) return;
    setHelpingId(req.id);

    try {
      const supabase = createClient();
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/sessions/create-from-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authSession?.access_token ? { Authorization: `Bearer ${authSession.access_token}` } : {}),
        },
        body: JSON.stringify({
          learnerId: req.user_id,
          helpRequestId: req.id,
          helpRequestTitle: req.title,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create session');
      }

      await supabase.from('notifications').insert({
        user_id: req.user_id,
        type: 'session_request',
        title: 'Someone wants to help!',
        message: `${profile.username || 'A user'} offered to help with "${req.title}".`,
        link: '/dashboard/sessions',
      });

      toast.success('Help offer sent! They will be notified.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setHelpingId(null);
    }
  };

  const totalRequests = requests.length;
  const myRequests = requests.filter(r => r.user_id === profile?.id).length;
  const totalBounty = requests.reduce((sum, r) => sum + (r.credits_offered || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 size={32} className="animate-spin text-neo-purple" />
        <span className="font-heading font-black uppercase tracking-widest text-neo-ink">Loading Requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Requests', value: totalRequests, icon: HelpCircle, bg: 'bg-neo-purple', color: 'text-white' },
          { label: 'Total Bounty', value: `${totalBounty}C`, icon: Coins, bg: 'bg-neo-yellow', color: 'text-neo-ink' },
          { label: 'Your Posts', value: myRequests, icon: Users, bg: 'bg-neo-green', color: 'text-neo-ink' },
        ].map((stat) => (
          <div key={stat.label} className="ss-card border-[3px] p-4 flex items-center gap-4 bg-white">
            <div className={cn('w-12 h-12 rounded-md border-[2px] border-neo-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0_#111111]', stat.bg)}>
              <stat.icon size={20} strokeWidth={2.5} className={stat.color} />
            </div>
            <div>
              <p className="text-2xl font-heading font-black text-neo-ink leading-none">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neo-ink/70 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="ss-card border-[3px] p-6 bg-neo-cream shadow-[4px_4px_0_#111111] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-6 border-b-[3px] border-neo-ink pb-4">
            <div className="w-10 h-10 rounded-md bg-neo-purple border-[2px] border-neo-ink flex items-center justify-center shadow-[2px_2px_0_#111111]">
              <AlertCircle size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <h3 className="text-xl font-heading font-black uppercase tracking-tight text-neo-ink">Post a Help Request</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Title</label>
              <input 
                type="text" 
                placeholder="E.G. URGENT: NEED HELP DEBUGGING REACT ROUTER"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Details</label>
              <textarea 
                placeholder="EXPLAIN WHAT YOU ARE STUCK ON…"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-medium text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all resize-none uppercase"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Bounty (Credits)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCredits(val)}
                      className={cn(
                        "w-12 h-12 rounded-sm text-lg font-heading font-black transition-all border-[3px]",
                        credits === val
                          ? "bg-neo-yellow text-neo-ink border-neo-ink shadow-[2px_2px_0_#111111]"
                          : "bg-white text-neo-ink border-neo-ink hover:bg-neo-yellow/30"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                  <input 
                    type="number" 
                    min="1"
                    value={credits}
                    onChange={e => setCredits(parseInt(e.target.value) || 1)}
                    className="w-20 h-12 bg-white border-[3px] border-neo-ink px-3 text-lg font-heading font-black text-neo-ink text-center focus:outline-none focus:border-neo-purple transition-colors ml-2"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" size="lg" disabled={submitting || !title || !description} className="w-full sm:w-auto">
                {submitting ? <><Loader2 size={16} strokeWidth={3} className="animate-spin mr-2" /> POSTING...</> : 'POST REQUEST'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="NO ACTIVE REQUESTS"
            description="Be the first to post a help request and offer credits as a bounty!"
            action={
              <Button variant="primary" size="md" onClick={() => setShowForm(true)} icon={<Plus size={16} strokeWidth={3} />}>
                Create First Request
              </Button>
            }
          />
        ) : (
          requests.map(req => {
            const peerAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${req.profiles?.username || 'anon'}&backgroundColor=FFF9E9`;
            const isOwn = profile?.id === req.user_id;

            return (
              <div
                key={req.id}
                className="ss-card border-[3px] flex flex-col md:flex-row bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] transition-all group overflow-hidden"
              >
                <div className="flex-1 p-6 flex flex-col relative">
                  {/* Avatar & Meta */}
                  <div className="flex items-center gap-4 mb-4">
                    <Image
                      src={peerAvatar}
                      alt={req.profiles?.username || 'User'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-md border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111]"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading font-black text-neo-ink uppercase tracking-tight text-lg leading-none">
                          {req.profiles?.username || 'Unknown'}
                        </span>
                        {isOwn && (
                          <span className="text-[9px] px-1.5 py-0.5 border-[2px] border-neo-ink bg-neo-purple text-white font-bold uppercase tracking-widest">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-neo-ink/50 flex items-center gap-1.5 uppercase tracking-widest">
                        <Clock size={12} strokeWidth={2.5} /> {timeAgo(req.created_at)}
                      </p>
                    </div>
                  </div>

                  <h3 className="font-heading font-black text-xl text-neo-ink mb-3 group-hover:text-neo-purple transition-colors uppercase tracking-tight">
                    {req.title}
                  </h3>
                  <p className="text-sm font-medium text-neo-ink/80 leading-relaxed uppercase">
                    {req.description}
                  </p>
                </div>
                
                {/* Bounty & Action Sidebar */}
                <div className="md:w-[200px] bg-neo-surface border-t-[3px] md:border-t-0 md:border-l-[3px] border-neo-ink p-6 flex flex-row md:flex-col items-center justify-between gap-4 shrink-0">
                  <div className="text-center w-full">
                    <span className="block text-[11px] font-heading font-black text-neo-ink uppercase tracking-widest mb-2">BOUNTY</span>
                    <div className="flex items-center justify-center gap-2 py-3 bg-white border-[3px] border-neo-ink shadow-[4px_4px_0_#111111]">
                      <Coins size={20} strokeWidth={3} className="text-neo-yellow" />
                      <span className="text-2xl font-heading font-black text-neo-ink">{req.credits_offered}</span>
                    </div>
                  </div>
                  
                  {!isOwn ? (
                    <Button 
                      variant="primary"
                      size="md"
                      onClick={() => handleHelp(req)}
                      disabled={helpingId === req.id}
                      className="w-full text-sm py-4"
                      icon={helpingId === req.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={3} />}
                    >
                      HELP OUT
                    </Button>
                  ) : (
                    <Button 
                      variant="danger"
                      size="md"
                      onClick={() => handleDelete(req.id)}
                      className="w-full text-sm py-4"
                      icon={<Trash2 size={16} strokeWidth={3} />}
                    >
                      DELETE
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
