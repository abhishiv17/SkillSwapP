'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, Paperclip, Mic, Image as ImageIcon, FileText, UserPlus, Check, X, Play, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { PageHeader } from '@/components/dashboard/ui/PageHeader';
import { Button } from '@/components/dashboard/ui/Button';

export default function MessagesPage() {
  const { profile } = useUser();
  const [supabase] = useState(() => createClient());
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [inputText, setInputText] = useState('');
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Voice recording requires a secure connection.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleFileUpload(audioBlob, `voice_memo_${Date.now()}.webm`, 'audio');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      toast.error('Microphone access denied. Error: ' + err.message);
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const type = file.type.startsWith('image/') ? 'image' : 'pdf';
    await handleFileUpload(file, file.name, type);
  };

  const handleFileUpload = async (file: File | Blob, fileName: string, fileType: string) => {
    if (!profile) return toast.error('You must be logged in.');
    setIsUploading(true);
    const filePath = `${profile.id}/${Date.now()}_${fileName}`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('message_attachments')
        .getPublicUrl(filePath);

      const otherUserId = activeChats.find(c => c.id === selectedChat)?.requester_id === profile.id 
        ? activeChats.find(c => c.id === selectedChat)?.receiver_id 
        : activeChats.find(c => c.id === selectedChat)?.requester_id;

      if (otherUserId) {
        await supabase.from('messages').insert({
          sender_id: profile.id,
          receiver_id: otherUserId,
          attachment_url: publicUrlData.publicUrl,
          attachment_name: fileName,
          attachment_type: fileType,
        });
      }
      
      toast.success('Attachment sent!');
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [connections, setConnections] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  const pendingRequests = connections.filter(c => c.receiver_id === profile?.id && c.status === 'pending');
  const activeChats = connections.filter(c => c.status === 'accepted');

  const selectedChatRef = useRef(selectedChat);
  const connectionsRef = useRef(connections);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    connectionsRef.current = connections;
  }, [selectedChat, connections]);

  useEffect(() => {
    async function loadConnections() {
      if (!profile?.id) return;
      
      const { data: rawConnections, error } = await supabase
        .from('connections')
        .select('id, status, requester_id, receiver_id, created_at, updated_at')
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('updated_at', { ascending: false });

      if (error || !rawConnections) {
        setLoadingChats(false);
        return;
      }

      const peerIds = Array.from(new Set(
        rawConnections.flatMap(c => [c.requester_id, c.receiver_id]).filter(id => id !== profile.id)
      ));

      let profileMap: Record<string, any> = {};
      if (peerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, college_name')
          .in('id', peerIds);
        
        profiles?.forEach(p => { profileMap[p.id] = p; });
      }

      const enrichedConnections = rawConnections.map(c => ({
        ...c,
        requester: c.requester_id === profile.id
          ? { id: profile.id, username: profile.username, full_name: profile.full_name, college_name: profile.college_name }
          : profileMap[c.requester_id] || { id: c.requester_id, username: 'Unknown', full_name: null, college_name: null },
        receiver: c.receiver_id === profile.id
          ? { id: profile.id, username: profile.username, full_name: profile.full_name, college_name: profile.college_name }
          : profileMap[c.receiver_id] || { id: c.receiver_id, username: 'Unknown', full_name: null, college_name: null },
      }));

      setConnections(enrichedConnections);
      setLoadingChats(false);
    }
    loadConnections();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    
    const room = supabase.channel('online_users');
    room.on('presence', { event: 'sync' }, () => {
      const newState = room.presenceState();
      const online = new Set<string>();
      Object.values(newState).forEach((presenceArray: any) => {
        presenceArray.forEach((p: any) => online.add(p.user_id));
      });
      setOnlineUsers(online);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await room.track({ user_id: profile.id, online_at: new Date().toISOString() });
      }
    });

    const realtimeSub = supabase.channel('messages_and_connections')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        if (newMessage.sender_id === profile.id || newMessage.receiver_id === profile.id) {
           const currentSelectedChat = selectedChatRef.current;
           const currentConnections = connectionsRef.current;
           
           const chat = currentConnections.find((c: any) => c.id === currentSelectedChat);
           const otherUserId = chat?.requester_id === profile.id ? chat?.receiver_id : chat?.requester_id;

           if (
             (newMessage.sender_id === profile.id && newMessage.receiver_id === otherUserId) ||
             (newMessage.sender_id === otherUserId && newMessage.receiver_id === profile.id)
           ) {
               setChatMessages(prev => {
                 if (prev.find(m => m.id === newMessage.id)) return prev;
                 return [...prev, newMessage];
               });
               
               if (newMessage.receiver_id === profile.id) {
                  supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', newMessage.id).then(({ error }) => { if (error) console.error(error); });
               }
           }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
         setChatMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'connections' }, async (payload) => {
         const newConn = payload.new as any;
         if (newConn.requester_id === profile.id || newConn.receiver_id === profile.id) {
            const peerId = newConn.requester_id === profile.id ? newConn.receiver_id : newConn.requester_id;
            const { data: peerProfile } = await supabase
              .from('profiles')
              .select('id, username, full_name, college_name')
              .eq('id', peerId)
              .single();

            const enrichedConn = {
              ...newConn,
              requester: newConn.requester_id === profile.id
                ? { id: profile.id, username: profile.username, full_name: profile.full_name, college_name: profile.college_name }
                : peerProfile || { id: newConn.requester_id, username: 'Unknown', full_name: null, college_name: null },
              receiver: newConn.receiver_id === profile.id
                ? { id: profile.id, username: profile.username, full_name: profile.full_name, college_name: profile.college_name }
                : peerProfile || { id: newConn.receiver_id, username: 'Unknown', full_name: null, college_name: null },
            };
              
            setConnections(prev => {
               if (prev.find(c => c.id === enrichedConn.id)) return prev;
               return [enrichedConn, ...prev];
            });
         }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'connections' }, (payload) => {
         const updatedConn = payload.new;
         if (updatedConn.requester_id === profile.id || updatedConn.receiver_id === profile.id) {
             setConnections(prev => prev.map(c => c.id === updatedConn.id ? { ...c, status: updatedConn.status } : c));
         }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'connections' }, (payload) => {
         const deletedConn = payload.old;
         setConnections(prev => prev.filter(c => c.id !== deletedConn.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(room);
      supabase.removeChannel(realtimeSub);
    };
  }, [profile?.id]);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedChat || !profile?.id) return;
      const currentConnections = connectionsRef.current;
      const chat = currentConnections.find(c => c.id === selectedChat);
      if (!chat) return;
      const otherUserId = chat.requester_id === profile.id ? chat.receiver_id : chat.requester_id;
      
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${profile.id})`)
        .order('created_at', { ascending: true });
        
      if (data) {
        setChatMessages(data);
        const unreadIds = data.filter(m => m.receiver_id === profile.id && !m.is_read).map(m => m.id);
        if (unreadIds.length > 0) {
           await supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unreadIds);
        }
      }
    }
    loadMessages();
  }, [selectedChat, profile?.id]);

  const handleAcceptRequest = async (connectionId: string) => {
    const { error } = await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId);
    if (!error) {
      setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: 'accepted' } : c));
      const req = pendingRequests.find(r => r.id === connectionId);
      if (req && req.requester_id) {
         await supabase.from('notifications').insert({
            user_id: req.requester_id,
            type: 'connection_accepted',
            title: 'Connection Accepted',
            message: `${profile?.full_name || profile?.username || 'Someone'} accepted your connection request!`,
            link: `/dashboard/messages`
         });
      }
      toast.success('Request accepted! You can now message each other.');
      setActiveTab('messages');
      setSelectedChat(connectionId);
    } else toast.error('Failed to accept request.');
  };

  const handleDeclineRequest = async (connectionId: string) => {
    const { error } = await supabase.from('connections').delete().eq('id', connectionId);
    if (!error) {
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast.info('Request declined.');
    } else toast.error('Failed to decline request.');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !profile?.id || !selectedChat) return;
    const chat = activeChats.find(c => c.id === selectedChat);
    if (!chat) return;
    const otherUserId = chat.requester_id === profile.id ? chat.receiver_id : chat.requester_id;

    const { error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: otherUserId,
      content: inputText
    });
    
    if (error) toast.error('Failed to send message');
    else setInputText('');
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-page-in h-[calc(100vh-140px)] flex flex-col">
      <PageHeader 
        title="Direct Messages"
        subtitle="Connect and share resources with your peers"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-full border-[4px] border-neo-ink bg-white shadow-[6px_6px_0_#111111] overflow-hidden flex-1 min-h-[400px]">
        {/* Left Sidebar: Chat List */}
        <div className={cn('md:col-span-1 flex flex-col border-r-0 md:border-r-[4px] border-neo-ink bg-neo-surface', selectedChat ? 'hidden md:flex' : 'flex')}>
          <div className="p-4 border-b-[4px] border-neo-ink bg-neo-cream flex gap-2">
            <button 
              onClick={() => setActiveTab('messages')}
              className={cn(
                "flex-1 font-heading font-black text-sm uppercase tracking-widest py-3 border-[2px] border-neo-ink transition-all",
                activeTab === 'messages' ? "bg-neo-purple text-white shadow-[3px_3px_0_#111111]" : "bg-white text-neo-ink opacity-70 hover:opacity-100"
              )}
            >
              Chats
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 font-heading font-black text-sm uppercase tracking-widest py-3 border-[2px] border-neo-ink transition-all",
                activeTab === 'requests' ? "bg-neo-yellow text-neo-ink shadow-[3px_3px_0_#111111]" : "bg-white text-neo-ink opacity-70 hover:opacity-100"
              )}
            >
              Reqs {pendingRequests.length > 0 && <span className="bg-neo-coral text-white text-[10px] px-2 py-0.5 rounded-full border-2 border-neo-ink shadow-[1px_1px_0_#111111]">{pendingRequests.length}</span>}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="p-8 text-center text-neo-ink font-bold uppercase tracking-widest animate-pulse">Loading...</div>
            ) : activeTab === 'messages' ? (
              activeChats.length > 0 ? activeChats.map((chat) => {
                const otherUser = chat.requester_id === profile?.id ? chat.receiver : chat.requester;
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 border-b-[2px] border-neo-ink transition-colors text-left relative",
                      selectedChat === chat.id ? 'bg-neo-yellow/30' : 'hover:bg-neo-cream/50'
                    )}
                  >
                    <div className="relative shrink-0">
                      <Image 
                        src={`https://api.dicebear.com/9.x/bottts/svg?seed=${otherUser?.username || 'user'}&backgroundColor=FFF9E9`} 
                        alt="Avatar" width={48} height={48} className="rounded-md border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111]" 
                      />
                      {onlineUsers.has(otherUser?.id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-neo-green border-2 border-neo-ink rounded-full shadow-[1px_1px_0_#111111]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-heading font-black text-neo-ink text-base uppercase tracking-tight block truncate">{otherUser?.full_name || otherUser?.username}</span>
                      <p className="text-[10px] font-bold text-neo-ink/60 uppercase">Connected</p>
                    </div>
                  </button>
                );
              }) : <div className="p-8 text-center text-neo-ink/60 font-bold uppercase tracking-widest text-sm">No Active Chats</div>
            ) : (
              pendingRequests.length > 0 ? pendingRequests.map((req) => (
                <div key={req.id} className="p-4 border-b-[2px] border-neo-ink bg-neo-yellow/10">
                  <div className="flex items-center gap-4 mb-4">
                    <Image 
                      src={`https://api.dicebear.com/9.x/bottts/svg?seed=${req.requester?.username || 'user'}&backgroundColor=FFF9E9`} 
                      alt="Avatar" width={48} height={48} className="rounded-md border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111] shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-heading font-black text-neo-ink text-base uppercase tracking-tight block truncate">{req.requester?.full_name || req.requester?.username}</span>
                      <p className="text-[10px] font-bold text-neo-ink/60 uppercase truncate">{req.requester?.college_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="success" size="sm" onClick={() => handleAcceptRequest(req.id)} className="flex-1 px-0 py-2 text-[10px]">
                      ACCEPT
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeclineRequest(req.id)} className="px-3 py-2">
                      <X size={14} strokeWidth={3} />
                    </Button>
                  </div>
                </div>
              )) : <div className="p-8 text-center text-neo-ink/60 font-bold uppercase tracking-widest text-sm">No Requests</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn('md:col-span-2 flex flex-col bg-white relative', !selectedChat ? 'hidden md:flex' : 'flex')}>
          {activeTab === 'messages' && selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b-[4px] border-neo-ink bg-neo-cream flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden w-10 h-10 flex items-center justify-center border-[2px] border-neo-ink bg-white rounded-md shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  {(() => {
                    const chat = activeChats.find(c => c.id === selectedChat);
                    const otherUser = chat?.requester_id === profile?.id ? chat?.receiver : chat?.requester;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Image src={`https://api.dicebear.com/9.x/bottts/svg?seed=${otherUser?.username || 'user'}&backgroundColor=FFF9E9`} alt="Avatar" width={48} height={48} className="rounded-md border-[2px] border-neo-ink bg-white shadow-[2px_2px_0_#111111]" />
                          {onlineUsers.has(otherUser?.id) && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-neo-green border-2 border-neo-ink rounded-full shadow-[1px_1px_0_#111111]" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink">{otherUser?.full_name || otherUser?.username}</h3>
                          <span className={cn("text-[10px] font-bold uppercase tracking-widest", onlineUsers.has(otherUser?.id) ? "text-neo-green" : "text-neo-ink/50")}>
                            {onlineUsers.has(otherUser?.id) ? 'ONLINE NOW' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-[url('/grid.svg')] bg-center relative">
                {chatMessages.map((msg) => {
                  const isMe = msg.sender_id === profile?.id;
                  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
                      <div className={cn(
                        "px-5 py-3 border-[3px] border-neo-ink shadow-[4px_4px_0_#111111] relative group",
                        isMe 
                          ? "bg-neo-green text-neo-ink" 
                          : "bg-neo-surface text-neo-ink"
                      )}>
                        {msg.content && <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                        
                        {msg.attachment_url && (
                          <div className="mt-3">
                            {msg.attachment_type === 'image' && (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                <Image src={msg.attachment_url} alt="Attached image" width={240} height={180} className="border-[2px] border-neo-ink object-cover shadow-[2px_2px_0_#111111]" />
                              </a>
                            )}
                            {msg.attachment_type === 'audio' && (
                              <audio controls className="h-10 max-w-[240px]">
                                <source src={msg.attachment_url} type="audio/webm" />
                              </audio>
                            )}
                            {msg.attachment_type !== 'image' && msg.attachment_type !== 'audio' && (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white border-[2px] border-neo-ink px-4 py-2 font-bold uppercase text-xs shadow-[2px_2px_0_#111111] hover:-translate-y-0.5 transition-transform">
                                <FileText size={16} strokeWidth={2.5} /> {msg.attachment_name || 'DOCUMENT'}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-widest text-neo-ink/50 px-1">
                        <span>{timeStr}</span>
                        {isMe && (
                          <span className={msg.is_read ? "text-neo-purple" : ""}>
                            <Check size={14} strokeWidth={3} className={msg.is_read ? "opacity-100" : "opacity-40"} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t-[4px] border-neo-ink bg-neo-surface relative z-10">
                {isUploading && (
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neo-purple mb-2 animate-pulse">
                    <Loader2 size={14} className="animate-spin" /> UPLOADING ATTACHMENT...
                  </div>
                )}
                
                <div className="flex items-end gap-3 bg-white border-[3px] border-neo-ink p-2 shadow-[4px_4px_0_#111111] focus-within:shadow-[4px_4px_0_var(--ss-purple)] focus-within:border-neo-purple transition-all">
                  
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx" />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRecording || isUploading}
                    className="w-12 h-12 flex items-center justify-center shrink-0 border-[2px] border-transparent hover:border-neo-ink hover:bg-neo-yellow text-neo-ink transition-colors disabled:opacity-50"
                  >
                    <Paperclip size={20} strokeWidth={2.5} />
                  </button>

                  {isRecording ? (
                    <div className="flex-1 flex items-center gap-3 py-3 px-4 text-neo-coral animate-pulse font-heading font-black uppercase text-lg">
                      <Mic size={20} strokeWidth={3} /> 
                      RECORDING: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </div>
                  ) : (
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      placeholder="TYPE YOUR MESSAGE..." 
                      rows={1}
                      disabled={isUploading}
                      className="flex-1 bg-transparent border-none focus:outline-none text-base font-medium text-neo-ink placeholder:text-neo-ink/30 resize-none py-3 max-h-32 min-h-[48px] disabled:opacity-50"
                    />
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    {isRecording ? (
                      <button 
                        onClick={stopRecording}
                        className="w-12 h-12 flex items-center justify-center bg-neo-coral text-white border-[2px] border-neo-ink shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px]"
                      >
                        <div className="w-4 h-4 bg-white" />
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={startRecording}
                        disabled={isUploading || inputText.trim().length > 0}
                        className={cn(
                          "w-12 h-12 flex items-center justify-center border-[2px] transition-all",
                          inputText.trim() ? "border-transparent text-neo-ink/20 cursor-not-allowed" : "border-transparent hover:border-neo-ink hover:bg-neo-coral hover:text-white hover:shadow-[2px_2px_0_#111111] text-neo-ink disabled:opacity-50"
                        )}
                      >
                        <Mic size={20} strokeWidth={2.5} />
                      </button>
                    )}

                    <button 
                      onClick={handleSendMessage}
                      disabled={isUploading || (!inputText.trim() && !isRecording)}
                      className="w-12 h-12 flex items-center justify-center bg-neo-purple text-white border-[2px] border-neo-ink shadow-[2px_2px_0_#111111] hover:bg-neo-purple/90 disabled:opacity-50 disabled:grayscale active:shadow-none active:translate-y-[2px]"
                    >
                      <Send size={18} strokeWidth={3} className="-ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neo-ink/40 p-8 text-center bg-neo-surface">
              <div className="w-24 h-24 rounded-full border-[4px] border-neo-ink/20 flex items-center justify-center mb-6">
                <MessageSquare size={40} strokeWidth={2} />
              </div>
              <p className="font-heading font-black text-2xl uppercase tracking-tight">Select a Chat</p>
              <p className="font-bold uppercase tracking-widest text-xs mt-2">To start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
