'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useWebRTC } from '@/hooks/useWebRTC';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { authFetch } from '@/lib/authFetch';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Clock,
  Maximize2,
  Loader2,
  Wifi,
  WifiOff,
  Send,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

/* ── Chat message type ── */
interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
}

/* ── Elapsed timer component ── */
function SessionTimer({ startedAt }: { startedAt: Date }) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      setElapsed(
        hrs > 0
          ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  return <>{elapsed}</>;
}

export default function VideoRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const sessionId = typeof id === 'string' ? id : '';
  const { user, profile } = useUser();
  const [peerName, setPeerName] = useState('Peer');
  const [isTeaching, setIsTeaching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date>(new Date());
  const [endingSession, setEndingSession] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  /* Chat state */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<any>(null);

  /* Refs for <video> elements */
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  /* Fetch session metadata */
  useEffect(() => {
    if (!user || !sessionId) return;
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: session, error: sessionErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionErr || !session) {
        console.error('Failed to fetch session:', sessionErr);
        toast.error('Session not found or access denied');
        router.push(ROUTES.sessions);
        return;
      }

      // Check if user is a participant
      if (session.teacher_id !== user.id && session.learner_id !== user.id) {
        toast.error('You are not part of this session');
        router.push(ROUTES.sessions);
        return;
      }

      // Check if session is active
      if (session.status !== 'active') {
        toast.error(`This session is ${session.status}. Only active sessions can be joined.`);
        router.push(ROUTES.sessions);
        return;
      }

      const teaching = session.teacher_id === user.id;
      setIsTeaching(teaching);
      setSessionStartedAt(new Date(session.created_at));

      const peerId = teaching ? session.learner_id : session.teacher_id;
      const { data: peerProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', peerId)
        .single();
      if (peerProfile) setPeerName(peerProfile.username);

      setLoading(false);
    };
    fetchSession();
  }, [user, sessionId, router]);

  /* ── Real-time chat via Supabase Broadcast ── */
  useEffect(() => {
    if (!sessionId || !user) return;
    const supabase = createClient();

    const channel = supabase.channel(`chat-${sessionId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setChatMessages((prev) => {
          // Deduplicate
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();

    chatChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !user || !profile) return;

    const msg: ChatMessage = {
      id: `${user.id}-${Date.now()}`,
      sender: user.id,
      senderName: profile.username || 'You',
      text: chatInput.trim(),
      timestamp: Date.now(),
    };

    chatChannelRef.current?.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: msg,
    });

    setChatInput('');
  }, [chatInput, user, profile]);

  /* WebRTC — teacher is the "caller" (initiator) */
  const {
    localStream,
    remoteStream,
    cameraOn,
    micOn,
    screenSharing,
    connectionState,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    hangUp,
    reconnect,
  } = useWebRTC({
    sessionId,
    userId: user?.id ?? '',
    isCaller: isTeaching,
  });

  /* Bind local stream to <video> */
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  /* Bind remote stream to <video> */
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  /* Fullscreen helper */
  const handleFullscreen = useCallback(() => {
    remoteVideoRef.current?.requestFullscreen?.();
  }, []);

  /* Listen for session ended by peer (DB status change) */
  useEffect(() => {
    if (!sessionId || sessionEnded) return;
    const supabase = createClient();
    const sessionChannel = supabase
      .channel(`session-status-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          if (payload.new.status === 'completed') {
            toast.info('Session ended by your peer.');
            setSessionEnded(true);
            hangUp();
            setTimeout(() => router.push(`${ROUTES.reviews}?sessionId=${sessionId}`), 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, sessionEnded, hangUp, router]);

  /* Track if we ever connected (to distinguish real hangup from init-phase) */
  const hasConnectedOnceRef = useRef(false);
  useEffect(() => {
    if (connectionState === 'connected') hasConnectedOnceRef.current = true;
  }, [connectionState]);

  /* Listen for WebRTC hangup signal — only after we've been connected once */
  useEffect(() => {
    if (connectionState === 'closed' && !sessionEnded && hasConnectedOnceRef.current) {
      toast.info('Session ended by your peer.');
      setSessionEnded(true);
      setTimeout(() => router.push(`${ROUTES.reviews}?sessionId=${sessionId}`), 2000);
    }
  }, [connectionState, sessionEnded, router]);

  /* End session — calls the API to process credits */
  const handleEndSession = useCallback(async () => {
    if (endingSession || sessionEnded) return;
    setEndingSession(true);

    try {
      const res = await authFetch('/api/sessions/end', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to end session');
        setEndingSession(false);
        return;
      }

      toast.success('Session ended! Credits have been processed.');
      setSessionEnded(true);
      hangUp();

      // Navigate to reviews after a brief pause
      setTimeout(() => {
        router.push(`${ROUTES.reviews}?sessionId=${sessionId}`);
      }, 1500);
    } catch (err) {
      toast.error('Something went wrong ending the session');
      console.error(err);
      setEndingSession(false);
    }
  }, [endingSession, sessionEnded, sessionId, hangUp, router]);

  /* Avatars (fallback when cam off / no stream) */
  const peerAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${peerName}&backgroundColor=FFF9E9`;
  const myAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${profile?.username || 'User'}&backgroundColor=FFF9E9`;

  const isRemoteConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'new' || connectionState === 'connecting';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin text-accent-violet" />
        <p className="text-sm text-[var(--text-muted)]">Loading session…</p>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center">
          <Video size={28} className="text-accent-emerald" />
        </div>
        <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">Session Complete!</h2>
        <p className="text-sm text-[var(--text-muted)]">Redirecting to reviews…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-1">
            Live Session
          </h1>
          <span className="text-sm text-[var(--text-muted)]">
            {isTeaching ? 'Teaching' : 'Learning from'} <span className="text-accent-violet font-medium">{peerName}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          {/* Connection indicator */}
          <span className="flex items-center gap-1.5">
            {isRemoteConnected ? (
              <Wifi size={14} className="text-green-400" />
            ) : isConnecting ? (
              <WifiOff size={14} className="text-yellow-400 animate-pulse" />
            ) : (
              <WifiOff size={14} className="text-red-400" />
            )}
            <span className="text-xs capitalize">
              {connectionState === 'new' ? 'Connecting…' : connectionState}
            </span>
          </span>
          {/* Session timer */}
          <span className="flex items-center gap-1 font-mono text-xs">
            <Clock size={14} />
            <SessionTimer startedAt={sessionStartedAt} />
          </span>
          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Remote video (large) ── */}
        <div className="lg:col-span-2">
          <div className="relative aspect-video rounded-2xl bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] overflow-hidden">
            {/* Video element — always mounted */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isRemoteConnected && remoteStream && remoteStream.getVideoTracks().length > 0 ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Fallback avatar when not connected */}
            {(!isRemoteConnected || !remoteStream || remoteStream.getVideoTracks().length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-deep)] to-[var(--bg-surface)]">
                <div className="relative">
                  <Image
                    src={peerAvatar}
                    alt={peerName}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full mb-4 ring-4 ring-accent-violet/20"
                  />
                  {isConnecting && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--bg-surface)] border-2 border-accent-violet/30 flex items-center justify-center">
                      <Loader2 size={14} className="animate-spin text-accent-violet" />
                    </div>
                  )}
                </div>
                <p className="font-heading font-semibold text-[var(--text-primary)]">
                  {peerName}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {isConnecting ? 'Connecting…' : connectionState === 'failed' ? 'Connection failed — retrying…' : 'Waiting for peer…'}
                </p>
              </div>
            )}

            {/* Name badge */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg glass text-sm font-medium text-[var(--text-primary)]">
              {peerName}
            </div>
            {/* Fullscreen btn */}
            <button
              onClick={handleFullscreen}
              className="absolute top-4 right-4 p-2 rounded-lg glass text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* ── Sidebar: local video + chat ── */}
        <div className="flex flex-col gap-4">
          {/* Local video */}
          <div className="relative aspect-video rounded-2xl bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover mirror transition-opacity duration-300 ${
                cameraOn ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Fallback avatar when cam off */}
            {!cameraOn && (
              <div className="absolute inset-0 bg-[var(--bg-deep)]/90 flex flex-col items-center justify-center">
                <Image
                  src={myAvatar}
                  alt="You"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full mb-2"
                />
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Camera off
                </p>
              </div>
            )}

            {/* Screen sharing indicator */}
            {screenSharing && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent-violet/20 border border-accent-violet/30">
                <Monitor size={12} className="text-accent-violet" />
                <span className="text-[10px] font-medium text-accent-violet">
                  Sharing Screen
                </span>
              </div>
            )}

            {/* Name badge */}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg glass text-xs font-medium text-[var(--text-secondary)]">
              You {isTeaching ? '(Teacher)' : '(Learner)'}
            </div>
          </div>

          {/* Chat panel */}
          <GlassCard padding="sm" className="flex-1 flex flex-col min-h-[200px] max-h-[320px]">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-accent-violet" />
              <span className="text-sm font-heading font-semibold text-[var(--text-primary)]">
                Chat
              </span>
              {chatMessages.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-violet/10 text-accent-violet font-medium">
                  {chatMessages.length}
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-thin">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-4 italic">
                  No messages yet. Say hi! 👋
                </p>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <div
                        className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words ${
                          isMe
                            ? 'bg-accent-violet/15 text-accent-violet border border-accent-violet/20'
                            : 'bg-[var(--bg-surface-solid)] text-[var(--text-primary)] border border-[var(--glass-border)]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-accent-violet/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send size={14} />
              </button>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="flex items-center justify-center gap-3">
        {/* Mic */}
        <button
          id="btn-toggle-mic"
          onClick={toggleMic}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
          className={`p-4 rounded-2xl transition-all duration-200 ${
            micOn
              ? 'glass text-[var(--text-primary)] hover:bg-[var(--bg-surface-solid)]'
              : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
          }`}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera */}
        <button
          id="btn-toggle-camera"
          onClick={toggleCamera}
          title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          className={`p-4 rounded-2xl transition-all duration-200 ${
            cameraOn
              ? 'glass text-[var(--text-primary)] hover:bg-[var(--bg-surface-solid)]'
              : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
          }`}
        >
          {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen share */}
        <button
          id="btn-toggle-screen"
          onClick={toggleScreenShare}
          title={screenSharing ? 'Stop sharing' : 'Share screen'}
          className={`p-4 rounded-2xl transition-all duration-200 ${
            screenSharing
              ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30 hover:bg-accent-violet/30'
              : 'glass text-[var(--text-primary)] hover:bg-[var(--bg-surface-solid)]'
          }`}
        >
          {screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>

        {/* Divider */}
        <div className="w-px h-10 bg-[var(--glass-border)] mx-1" />

        {/* End Session — calls API to process credits */}
        <button
          id="btn-end-session"
          onClick={handleEndSession}
          disabled={endingSession}
          title="End session & process credits"
          className="px-6 py-4 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all duration-200 flex items-center gap-2 font-heading font-semibold text-sm disabled:opacity-50"
        >
          {endingSession ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Ending…
            </>
          ) : (
            <>
              <PhoneOff size={18} />
              End Session
            </>
          )}
        </button>
      </div>

      {/* Connection warning / Rejoin */}
      {(connectionState === 'failed' || connectionState === 'disconnected') && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-5 rounded-xl bg-accent-amber/10 border border-accent-amber/20">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent-amber" />
            <span className="text-sm text-accent-amber font-medium">
              Connection lost. The video feed has stopped.
            </span>
          </div>
          <button
            onClick={reconnect}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-amber/20 hover:bg-accent-amber/30 text-accent-amber transition-colors text-sm font-semibold"
          >
            <RefreshCw size={14} />
            Rejoin Session
          </button>
        </div>
      )}
    </div>
  );
}
