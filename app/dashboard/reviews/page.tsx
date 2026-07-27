'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/dashboard/ui/Button';
import { PageHeader } from '@/components/dashboard/ui/PageHeader';
import { Star, Loader2, Twitter, Linkedin, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';

import { Suspense } from 'react';

interface ReviewRow {
  id: string;
  session_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  feedback: string;
  created_at: string;
}

interface ProfileMap {
  [id: string]: { username: string };
}

function ReviewsContent() {
  const { user } = useUser();
  const [supabase] = useState(() => createClient());
  const searchParams = useSearchParams();
  const preselectedSessionId = searchParams.get('sessionId');

  const { data, isLoading: loading } = useQuery({
    queryKey: ['reviews', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: received, error: receivedErr }, { data: given, error: givenErr }] = await Promise.all([
        supabase.from('reviews').select('*').eq('reviewee_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').eq('reviewer_id', user!.id).order('created_at', { ascending: false }),
      ]);

      if (receivedErr || givenErr) {
        console.error('Failed to fetch reviews:', receivedErr || givenErr);
        toast.error('Failed to load reviews');
        throw receivedErr || givenErr;
      }

      const allReviews = [...(received || []), ...(given || [])];
      let profileMap: ProfileMap = {};

      // Fetch profiles
      const userIds = Array.from(new Set(
        allReviews.flatMap((r) => [r.reviewer_id, r.reviewee_id]).filter((id) => id !== user!.id)
      ));
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesErr } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
        
        if (profilesErr) {
           console.error('Failed to fetch profiles:', profilesErr);
        }

        profilesData?.forEach((p) => { profileMap[p.id] = { username: p.username }; });
      }

      return {
        received: (received || []) as ReviewRow[],
        given: (given || []) as ReviewRow[],
        profiles: profileMap,
      };
    },
    staleTime: 60 * 1000,
  });

  const receivedReviews = data?.received || [];
  const givenReviews = data?.given || [];
  const profiles = data?.profiles || {};

  // New review form state
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Unreviewed sessions state
  const [unreviewedSessions, setUnreviewedSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(preselectedSessionId || '');
  const [loadingUnreviewed, setLoadingUnreviewed] = useState(true);

  // Fetch completed sessions that haven't been reviewed by this user yet
  useEffect(() => {
    if (!user) return;
    const fetchUnreviewed = async () => {
      setLoadingUnreviewed(true);
      // Fetch completed sessions AND existing reviews in parallel (independent)
      const [{ data: completedSessions }, { data: existingReviews }] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('status', 'completed')
          .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
          .order('ended_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('session_id')
          .eq('reviewer_id', user.id),
      ]);

      if (!completedSessions || completedSessions.length === 0) {
        setUnreviewedSessions([]);
        setLoadingUnreviewed(false);
        return;
      }

      const reviewedSessionIds = new Set((existingReviews || []).map(r => r.session_id));

      // Filter out already-reviewed sessions
      const unreviewed = completedSessions.filter(s => !reviewedSessionIds.has(s.id));

      // Fetch peer usernames for display
      if (unreviewed.length > 0) {
        const peerIds = Array.from(new Set(
          unreviewed.map(s => s.teacher_id === user.id ? s.learner_id : s.teacher_id)
        ));
        const { data: peerProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', peerIds);

        const peerMap: Record<string, string> = {};
        peerProfiles?.forEach(p => { peerMap[p.id] = p.username; });

        const enriched = unreviewed.map(s => ({
          ...s,
          peerName: peerMap[s.teacher_id === user.id ? s.learner_id : s.teacher_id] || 'Unknown',
          role: s.teacher_id === user.id ? 'TAUGHT' : 'LEARNED FROM',
        }));
        setUnreviewedSessions(enriched);
      } else {
        setUnreviewedSessions([]);
      }
      setLoadingUnreviewed(false);
    };
    fetchUnreviewed().catch(console.error);
  }, [user, supabase, data]); // re-run after reviews data refreshes

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!selectedSessionId) {
      toast.error('Please select a session to review');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: selectedSessionId,
          rating: newRating,
          feedback: feedback || 'Great session!',
        }),
      });

      if (res.ok) {
        toast.success('Review submitted!');
        setNewRating(0);
        setFeedback('');
        setSelectedSessionId('');
        // Remove the reviewed session from the dropdown
        setUnreviewedSessions(prev => prev.filter(s => s.id !== selectedSessionId));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit review');
      }
    } catch {
      toast.error('Network error');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin text-neo-purple" />
        <span className="font-heading font-black uppercase tracking-widest text-neo-ink">Loading Reviews...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8 animate-page-in">
      <PageHeader 
        title="Reviews"
        subtitle="Your ratings and feedback from skill sessions"
      />

      {/* Write a review */}
      <div className="ss-card border-[3px] bg-neo-yellow p-6 shadow-[6px_6px_0_#111111]">
        <h2 className="font-heading font-black text-2xl text-neo-ink mb-6 uppercase tracking-tight border-b-[3px] border-neo-ink pb-4">Leave a Review</h2>
        
        {loadingUnreviewed ? (
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-neo-ink/70">
            <Loader2 size={18} strokeWidth={3} className="animate-spin" /> LOADING SESSIONS…
          </div>
        ) : unreviewedSessions.length === 0 ? (
          <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/70 py-2">
            NO COMPLETED SESSIONS TO REVIEW. COMPLETE A SESSION FIRST!
          </p>
        ) : (
          <>
            {/* Session selector */}
            <div className="mb-6">
              <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Select Session</label>
              <div className="relative w-full">
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full pl-4 pr-10 h-[46px] bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink focus:outline-none focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all appearance-none cursor-pointer uppercase"
                >
                  <option value="">CHOOSE A SESSION TO REVIEW…</option>
                  {unreviewedSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.role} {s.peerName} — {new Date(s.ended_at || s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neo-ink">
                  ▼
                </div>
              </div>
            </div>

            {/* Star rating */}
            <div className="flex gap-2 mb-6 bg-white border-[3px] border-neo-ink p-4 w-max shadow-[3px_3px_0_#111111]">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setNewRating(star)} className="transition-transform hover:-translate-y-1">
                  <Star size={32} strokeWidth={2.5} className={cn('transition-colors', (hoverRating || newRating) >= star ? 'text-neo-yellow fill-neo-yellow drop-shadow-sm' : 'text-neo-ink/20')} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="SHARE YOUR EXPERIENCE..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all resize-none h-32 mb-6 uppercase"
            />
            <Button onClick={handleSubmitReview} disabled={submitting || !selectedSessionId} variant="primary" size="md" className="w-full sm:w-auto" icon={submitting ? <Loader2 size={18} strokeWidth={3} className="animate-spin" /> : <Star size={18} strokeWidth={3} />}>
              {submitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
            </Button>
          </>
        )}
      </div>

      {/* Received */}
      <div>
        <h2 className="font-heading font-black text-2xl text-neo-ink mb-6 uppercase tracking-tight">Reviews About You</h2>
        {receivedReviews.length === 0 ? (
          <div className="ss-card border-[3px] bg-white p-8 text-center shadow-[4px_4px_0_#111111]">
            <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/60">NO REVIEWS YET. COMPLETE A SESSION TO GET RATED!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {receivedReviews.map((review) => {
              const reviewerName = profiles[review.reviewer_id]?.username || 'A student';
              const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${reviewerName}&backgroundColor=FFF9E9`;
              return (
                <div key={review.id} className="ss-card border-[3px] bg-white p-6 shadow-[4px_4px_0_#111111] hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] transition-all">
                  <div className="flex items-start gap-4">
                    <Image src={avatarUrl} alt={reviewerName} width={48} height={48} className="w-12 h-12 border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-heading font-black uppercase tracking-tight text-neo-ink">{reviewerName}</span>
                        <div className="flex gap-0.5 ml-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={14} strokeWidth={3} className={cn(i < review.rating ? 'text-neo-yellow fill-neo-yellow' : 'text-neo-ink/20')} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-neo-ink/80 leading-relaxed mb-4">{review.feedback}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t-[2px] border-neo-ink/20">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neo-ink/60">
                          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        
                        {/* Social Share */}
                        {review.rating >= 4 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-heading font-black uppercase tracking-widest text-neo-ink/60 mr-2">SHARE</span>
                            <button 
                              onClick={() => {
                                const text = encodeURIComponent(`I just got a ${review.rating}-star review on SkillSwap from ${reviewerName}!\n\n"${review.feedback}"\n\nJoin the skill barter movement today: `);
                                window.open(`https://twitter.com/intent/tweet?text=${text}&url=https://code-carnage.vercel.app`, '_blank');
                              }}
                              className="w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink bg-white hover:bg-[#1DA1F2] hover:text-white text-neo-ink shadow-[2px_2px_0_#111111] transition-all active:shadow-none active:translate-y-[2px]"
                              title="Share on Twitter / X"
                            >
                              <Twitter size={14} strokeWidth={3} />
                            </button>
                            <button 
                              onClick={() => {
                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://code-carnage.vercel.app`, '_blank');
                              }}
                              className="w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink bg-white hover:bg-[#0A66C2] hover:text-white text-neo-ink shadow-[2px_2px_0_#111111] transition-all active:shadow-none active:translate-y-[2px]"
                              title="Share on LinkedIn"
                            >
                              <Linkedin size={14} strokeWidth={3} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Given */}
      <div>
        <h2 className="font-heading font-black text-2xl text-neo-ink mb-6 uppercase tracking-tight">Reviews You Wrote</h2>
        {givenReviews.length === 0 ? (
          <div className="ss-card border-[3px] bg-neo-surface p-8 text-center shadow-[4px_4px_0_#111111]">
            <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/60">YOU HAVEN&apos;T WRITTEN ANY REVIEWS YET.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {givenReviews.map((review) => {
              const revieweeName = profiles[review.reviewee_id]?.username || 'A student';
              const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${revieweeName}&backgroundColor=FFF9E9`;
              return (
                <div key={review.id} className="ss-card border-[3px] bg-neo-surface p-6 shadow-[4px_4px_0_#111111] opacity-90 grayscale-[0.2]">
                  <div className="flex items-start gap-4">
                    <Image src={avatarUrl} alt={revieweeName} width={40} height={40} className="w-10 h-10 border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-heading font-black uppercase tracking-widest text-neo-ink">TO {revieweeName}</span>
                        <div className="flex gap-0.5 ml-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} strokeWidth={3} className={cn(i < review.rating ? 'text-neo-yellow fill-neo-yellow' : 'text-neo-ink/20')} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-neo-ink/80">{review.feedback}</p>
                    </div>
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

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 size={32} className="animate-spin text-neo-purple" /><span className="font-heading font-black uppercase tracking-widest text-neo-ink">Loading Reviews...</span></div>}>
      <ReviewsContent />
    </Suspense>
  );
}
