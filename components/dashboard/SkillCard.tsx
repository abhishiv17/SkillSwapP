'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SkillTag } from '@/components/dashboard/ui/SkillTag';
import { Button } from '@/components/dashboard/ui/Button';
import type { MarketplaceListing } from '@/types/marketplace';
import { Clock, Coins, BadgeCheck, Check, Send, Trophy, Zap, MessageSquare } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SkillCardProps {
  listing: MarketplaceListing;
}

export function SkillCard({ listing }: SkillCardProps) {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');

  useEffect(() => {
    if (!currentUser?.id || currentUser.id === listing.user.id) return;
    const supabase = createClient();
    supabase
      .from('connections')
      .select('status')
      .or(`and(requester_id.eq.${currentUser.id},receiver_id.eq.${listing.user.id}),and(requester_id.eq.${listing.user.id},receiver_id.eq.${currentUser.id})`)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setConnectionStatus(data.status as 'pending' | 'accepted');
      });
  }, [currentUser?.id, listing.user.id]);

  const handleConnect = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to connect.');
      return;
    }
    if (currentUser.id === listing.user.id) return;
    
    setIsConnecting(true);
    const supabase = createClient();
    
    try {
      const { data: existing } = await supabase
        .from('connections')
        .select('id, status, requester_id')
        .or(`and(requester_id.eq.${currentUser.id},receiver_id.eq.${listing.user.id}),and(requester_id.eq.${listing.user.id},receiver_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (existing) {
        setConnectionStatus(existing.status as 'pending' | 'accepted');
        if (existing.status === 'accepted') {
          toast.info('You are already connected!');
        } else {
          toast.info('Connection request already sent!');
        }
        setIsConnecting(false);
        return;
      }

      const { error: connectionError } = await supabase
        .from('connections')
        .insert({
          requester_id: currentUser.id,
          receiver_id: listing.user.id,
          status: 'pending'
        });
        
      if (connectionError) throw connectionError;
      
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', currentUser.id)
        .single();
        
      const myName = userProfile?.full_name || userProfile?.username || 'Someone';

      await supabase.from('notifications').insert({
        user_id: listing.user.id,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${myName} wants to connect with you to swap skills!`,
        link: `/dashboard/messages`
      });
      
      setConnectionStatus('pending');
      toast.success(`Connection request sent to ${listing.user.name}!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="ss-card border-[3px] flex flex-col h-full bg-white relative overflow-hidden group">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-neo-green/10 rounded-bl-[100px] pointer-events-none" />

      <div className="p-5 flex-1 flex flex-col relative z-10">
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <Image
            src={listing.user.avatar}
            alt={listing.user.name || 'User avatar'}
            width={48}
            height={48}
            className="w-12 h-12 rounded-md border-[2px] border-neo-ink bg-neo-cream shadow-[2px_2px_0_#111111]"
          />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-base font-heading font-black text-neo-ink uppercase tracking-tight truncate">
                {listing.user.name}
              </span>
              {listing.user.isVerified && (
                <BadgeCheck size={16} strokeWidth={2.5} className="text-neo-purple shrink-0" />
              )}
            </div>
            <p className="text-[11px] font-bold text-neo-ink/60 uppercase truncate">
              {listing.user.year} • ★ {listing.user.rating}
            </p>
          </div>
        </div>

        {/* Swap Info */}
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-neo-ink/50 uppercase w-12 text-right shrink-0">TEACHES</span>
            <SkillTag skill={listing.skillOffered} color="purple" className="flex-1 text-center py-1.5 text-xs shadow-[2px_2px_0_#111111]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-neo-ink/50 uppercase w-12 text-right shrink-0">WANTS</span>
            <SkillTag skill={listing.skillWanted} color="yellow" className="flex-1 text-center py-1.5 text-xs shadow-[2px_2px_0_#111111]" />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm font-medium text-neo-ink/80 leading-relaxed line-clamp-3 mb-6">
          {listing.description}
        </p>

        {/* Badges / Tags */}
        <div className="mt-auto">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {listing.user.rating >= 4.8 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-neo-ink bg-neo-yellow border-[2px] border-neo-ink px-2 py-1 rounded-sm uppercase">
                <Trophy size={10} strokeWidth={3} /> Top Rated
              </span>
            )}
            {listing.user.sessionsCompleted >= 5 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-neo-purple border-[2px] border-neo-ink px-2 py-1 rounded-sm uppercase">
                <Zap size={10} strokeWidth={3} /> Active
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Footer / CTA */}
      <div className="p-4 bg-neo-cream border-t-[3px] border-neo-ink flex items-center justify-between z-10">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-neo-ink uppercase">
            <Coins size={14} strokeWidth={2.5} className="text-neo-yellow" />
            {listing.creditsPerHour} CREDIT / HR
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-neo-ink/60 uppercase">
            <Clock size={12} strokeWidth={2.5} />
            {listing.availability}
          </span>
        </div>
        
        <Button 
          variant={connectionStatus === 'accepted' ? 'success' : connectionStatus === 'pending' ? 'warning' : 'primary'}
          size="sm"
          disabled={isConnecting || connectionStatus === 'pending'}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (connectionStatus === 'accepted') {
              router.push(`/dashboard/messages`);
            } else {
              handleConnect();
            }
          }}
          className="text-[11px]"
        >
          {connectionStatus === 'accepted' ? (
            <><MessageSquare size={14} strokeWidth={2.5} /> MESSAGE</>
          ) : connectionStatus === 'pending' ? (
            <><Check size={14} strokeWidth={3} /> REQUESTED</>
          ) : isConnecting ? (
            <><Send size={14} strokeWidth={2.5} className="animate-pulse" /> SENDING</>
          ) : (
            'REQUEST SWAP'
          )}
        </Button>
      </div>

    </div>
  );
}
