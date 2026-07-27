'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, X, Send, User, Sparkles, Loader2, ChevronDown, Mic, Paperclip, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/authFetch';

import { createClient } from '@/lib/supabase/client';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
};

const SUGGESTIONS = [
  '🎯 Find me a match for React',
  '🧠 Quiz me on Python',
  '💡 How do credits work?',
  '📚 Prep me for a session',
];

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm font-bold uppercase">{children}</p>,
        strong: ({ children }) => <span className="font-heading font-black text-neo-ink">{children}</span>,
        em: ({ children }) => <span className="italic text-neo-ink/80">{children}</span>,
        ul: ({ children }) => <ul className="mt-2 mb-3 space-y-2 pl-4 list-disc marker:text-neo-ink uppercase text-xs font-bold">{children}</ul>,
        ol: ({ children }) => <ol className="mt-2 mb-3 space-y-2 pl-4 list-decimal marker:text-neo-ink uppercase text-xs font-bold">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        h1: ({ children }) => <h1 className="font-heading font-black text-xl text-neo-ink mb-2 mt-4 uppercase tracking-tight">{children}</h1>,
        h2: ({ children }) => <h2 className="font-heading font-black text-lg text-neo-ink mb-2 mt-4 border-b-[3px] border-neo-ink pb-1 uppercase tracking-tight">{children}</h2>,
        h3: ({ children }) => <h3 className="font-heading font-black text-sm text-neo-purple uppercase tracking-widest mb-2 mt-3">{children}</h3>,
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          return isBlock ? <code className="block bg-neo-surface border-[3px] border-neo-ink p-3 text-xs font-mono text-neo-ink overflow-x-auto my-3 whitespace-pre shadow-[4px_4px_0_#111111]">{children}</code> : <code className="bg-neo-yellow/30 border-[2px] border-neo-ink px-1.5 py-0.5 text-xs font-mono text-neo-ink font-bold">{children}</code>;
        },
        blockquote: ({ children }) => <blockquote className="border-l-[4px] border-neo-purple pl-4 py-1 my-3 bg-neo-purple/10 text-neo-ink font-bold text-sm uppercase">{children}</blockquote>,
        hr: () => <hr className="border-t-[3px] border-neo-ink my-4" />,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-neo-purple font-black underline hover:bg-neo-yellow transition-colors decoration-[2px] underline-offset-4">{children}</a>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="w-2.5 h-2.5 bg-neo-ink rounded-full animate-bounce border-[2px] border-neo-ink shadow-[1px_1px_0_#111111]" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </div>
  );
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "HI! I'M YOUR **SKILLSWAP AI**. I CAN:\n- 🎯 FIND YOU THE PERFECT SKILL MATCH\n- 🧠 QUIZ YOU ON YOUR SKILLS\n- 📚 PREP YOU BEFORE A SESSION\n\nWHAT CAN I HELP WITH?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    async function loadHistory() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('ai_chat_history').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      if (data && data.length > 0) {
        const history: Message[] = data.map(d => ({ role: d.role, content: d.content, image: d.image_url }));
        setMessages(prev => [...prev, ...history]);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'en-IN';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setInput((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }
  }, []);

  const handleMicClick = () => {
    if (!recognition) return;
    isListening ? recognition.stop() : recognition.start();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setAttachedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      try {
        const text = await file.text();
        setAttachedFile({ name: file.name, content: text.slice(0, 10000) });
      } catch (err) {
        alert("Failed to parse file text.");
      }
    }
  };

  useEffect(() => {
    if (isOpen) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() && !attachedImage && !attachedFile) return;

    let finalMessage = text.trim();
    if (attachedFile) {
      finalMessage = `[Attached File: ${attachedFile.name}]\n${attachedFile.content}\n\nUser Question: ${finalMessage || 'Please analyze this document.'}`;
    }

    setInput('');
    const currentImage = attachedImage;
    setAttachedImage(null);
    setAttachedFile(null);
    if (isListening && recognition) recognition.stop();

    const newMessages: Message[] = [...messages, { role: 'user', content: finalMessage, image: currentImage || undefined }];
    setMessages(newMessages);
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: newMessages.map((m) => ({ role: m.role, content: m.content, image: m.image })) }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: '❌ Something went wrong. Please try again!' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-50 flex flex-col items-end pointer-events-none">
      <div className={cn('mb-4 transition-all duration-300 origin-bottom-right', isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-4 pointer-events-none')}>
        <div className={cn("flex flex-col ss-card bg-white border-[4px] shadow-[8px_8px_0_#111111] overflow-hidden", isFullScreen ? "fixed inset-4 w-auto h-auto z-[60]" : "w-[calc(100vw-2rem)] sm:w-[420px] h-[70vh] sm:h-[600px] max-h-[80vh]")}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-neo-purple border-b-[4px] border-neo-ink shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 border-[2px] border-neo-ink bg-neo-yellow flex items-center justify-center shadow-[2px_2px_0_#111111]">
                <Sparkles size={20} strokeWidth={3} className="text-neo-ink" />
                <span className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-neo-green border-[2px] border-neo-ink" />
              </div>
              <div>
                <p className="font-heading font-black text-xl text-white uppercase tracking-tight leading-none mb-1 drop-shadow-[2px_2px_0_#111111]">SkillSwap AI</p>
                <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest leading-none">Your personal assistant</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink bg-white hover:bg-neo-yellow text-neo-ink shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px] transition-all"
              >
                {isFullScreen ? <Minimize2 size={16} strokeWidth={3} /> : <Maximize2 size={16} strokeWidth={3} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink bg-neo-coral hover:bg-white text-neo-ink shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px] transition-all"
              >
                <ChevronDown size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scroll-smooth bg-neo-cream">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn('flex gap-3 max-w-[90%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
                
                {/* Avatar */}
                <div className={cn(
                  'shrink-0 w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]', 
                  msg.role === 'user' ? 'bg-neo-green' : 'bg-neo-purple'
                )}>
                  {msg.role === 'user' ? <User size={16} strokeWidth={3} className="text-neo-ink" /> : <Bot size={16} strokeWidth={3} className="text-white" />}
                </div>

                {/* Bubble */}
                <div className={cn(
                  'text-sm leading-relaxed px-4 py-3 border-[3px] border-neo-ink shadow-[4px_4px_0_#111111]', 
                  msg.role === 'user' 
                    ? 'bg-neo-yellow text-neo-ink rounded-bl-xl rounded-tl-xl rounded-br-xl' 
                    : 'bg-white text-neo-ink rounded-tr-xl rounded-br-xl rounded-bl-xl'
                )}>
                  {msg.image && (
                    <img src={msg.image} alt="User attachment" className="max-w-full rounded-md border-[2px] border-neo-ink mb-2" />
                  )}
                  {msg.role === 'assistant' && msg.content === '' && isTyping ? <TypingIndicator /> : <MarkdownMessage content={msg.content} />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="px-4 py-4 border-t-[4px] border-neo-ink bg-white shrink-0 relative z-10">
            {attachedImage && (
              <div className="mb-3 relative w-16 h-16 border-[3px] border-neo-ink shadow-[2px_2px_0_#111111]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachedImage} alt="Attached" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-neo-coral border-[2px] border-neo-ink flex items-center justify-center text-white shadow-[2px_2px_0_#111111] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#111111]"><X size={14} strokeWidth={3} /></button>
              </div>
            )}
            {attachedFile && (
              <div className="mb-3 p-2 border-[3px] border-neo-ink bg-neo-surface shadow-[2px_2px_0_#111111] flex items-center justify-between w-fit max-w-[200px]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText size={16} strokeWidth={3} className="text-neo-ink shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neo-ink truncate">{attachedFile.name}</span>
                </div>
                <button type="button" onClick={() => setAttachedFile(null)} className="ml-3 hover:text-neo-coral"><X size={16} strokeWidth={3} /></button>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white border-[3px] border-neo-ink p-1 shadow-[4px_4px_0_#111111]">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="w-10 h-10 flex items-center justify-center hover:bg-neo-surface text-neo-ink transition-colors border-[2px] border-transparent hover:border-neo-ink"
              >
                <Paperclip size={18} strokeWidth={3} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              
              <input 
                ref={inputRef} 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="ASK ME ANYTHING..." 
                disabled={isTyping} 
                className="flex-1 bg-transparent text-sm font-bold uppercase text-neo-ink placeholder:text-neo-ink/30 focus:outline-none" 
              />
              
              <button 
                type="button" 
                onClick={handleMicClick} 
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-colors border-[2px] border-transparent",
                  isListening ? "bg-neo-coral text-white border-neo-ink animate-pulse" : "hover:bg-neo-surface text-neo-ink hover:border-neo-ink"
                )}
              >
                <Mic size={18} strokeWidth={3} />
              </button>
              
              <button 
                type="submit" 
                disabled={(!input.trim() && !attachedImage && !attachedFile) || isTyping} 
                className={cn(
                  'w-12 h-10 flex items-center justify-center border-[2px] border-neo-ink transition-all', 
                  (input.trim() || attachedImage || attachedFile) && !isTyping 
                    ? 'bg-neo-purple hover:bg-neo-purple/90 text-white shadow-[2px_2px_0_#111111] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px]' 
                    : 'bg-neo-surface text-neo-ink/30 cursor-not-allowed'
                )}
              >
                {isTyping ? <Loader2 size={18} strokeWidth={3} className="animate-spin" /> : <Send size={18} strokeWidth={3} />}
              </button>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-neo-ink/40 text-center mt-3">Powered by Groq · Llama 3.1</p>
          </form>
        </div>
      </div>

      {/* ── FAB Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'pointer-events-auto w-16 h-16 flex items-center justify-center border-[4px] border-neo-ink shadow-[6px_6px_0_#111111] hover:shadow-[8px_8px_0_#111111] active:shadow-[2px_2px_0_#111111] active:translate-y-[4px] active:translate-x-[4px] transition-all',
          isOpen
            ? 'bg-white text-neo-ink'
            : 'bg-neo-purple text-white hover:bg-neo-yellow hover:text-neo-ink'
        )}
      >
        <div className={cn('transition-all duration-300', isOpen ? 'rotate-90' : 'rotate-0')}>
          {isOpen ? <X size={28} strokeWidth={3} /> : <Bot size={28} strokeWidth={3} />}
        </div>
        {/* Notification pulse when closed */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-neo-green border-[2px] border-neo-ink animate-pulse" />
        )}
      </button>
    </div>
  );
}
