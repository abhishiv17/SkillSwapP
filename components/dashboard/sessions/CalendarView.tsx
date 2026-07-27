'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/dashboard/ui/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Loader2,
  Plus,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface SessionRow {
  id: string;
  teacher_id: string;
  learner_id: string;
  status: string;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'session', label: 'Session', color: 'bg-neo-purple text-white border-neo-ink' },
  { value: 'study', label: 'Study', color: 'bg-neo-yellow text-neo-ink border-neo-ink' },
  { value: 'deadline', label: 'Deadline', color: 'bg-neo-coral text-white border-neo-ink' },
  { value: 'other', label: 'Other', color: 'bg-neo-green text-neo-ink border-neo-ink' },
];

function getCategoryStyle(category: string) {
  return CATEGORIES.find(c => c.value === category)?.color || CATEGORIES[3].color;
}

export function CalendarView() {
  const { user } = useUser();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());

  // CRUD form state
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formCategory, setFormCategory] = useState('session');
  const [submitting, setSubmitting] = useState(false);

  // Selected day for detail view
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-data', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch sessions
      const { data: sessionsData, error: sessionsErr } = await supabase
        .from('sessions')
        .select('*')
        .or(`teacher_id.eq.${user!.id},learner_id.eq.${user!.id}`)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false });

      if (sessionsErr) throw sessionsErr;
      const sessions = (sessionsData || []) as SessionRow[];

      // Fetch peer profiles
      let profiles: Record<string, string> = {};
      const peerIds = Array.from(new Set(
        sessions.flatMap((s) => [s.teacher_id, s.learner_id]).filter((id) => id !== user!.id)
      ));
      if (peerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', peerIds);
        profilesData?.forEach((p) => { profiles[p.id] = p.username; });
      }

      // Fetch user's calendar events
      const { data: eventsData } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .order('event_date', { ascending: true });

      return { sessions, profiles, events: (eventsData || []) as CalendarEvent[] };
    },
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Map sessions to display items
  const sessionEvents = (data?.sessions || []).map(session => {
    const isTeaching = session.teacher_id === user?.id;
    const peerId = isTeaching ? session.learner_id : session.teacher_id;
    const peerName = data?.profiles[peerId] || 'Unknown';
    const date = new Date(session.created_at);

    return {
      id: session.id,
      date: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      title: isTeaching ? `TEACHING ${peerName}` : `LEARNING FROM ${peerName}`,
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: isTeaching ? 'teaching' : 'learning',
      status: session.status,
      source: 'session' as const,
    };
  });

  // Map custom calendar events to display items
  const customEvents = (data?.events || []).map(event => {
    const date = new Date(event.event_date);
    return {
      id: event.id,
      date: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      title: event.title,
      time: event.event_time || '',
      type: event.category,
      status: event.category,
      source: 'custom' as const,
      description: event.description,
    };
  });

  const allEvents = [...sessionEvents, ...customEvents];
  const currentMonthEvents = allEvents.filter(e => e.month === currentDate.getMonth() && e.year === currentDate.getFullYear());

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // --- CRUD ---
  const resetForm = useCallback(() => {
    setFormTitle('');
    setFormDescription('');
    setFormDate('');
    setFormTime('');
    setFormCategory('session');
    setEditingEvent(null);
    setShowForm(false);
  }, []);

  const openCreateForm = useCallback((day?: number) => {
    resetForm();
    if (day) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      // Format as YYYY-MM-DD local time
      const offset = d.getTimezoneOffset()
      d.setMinutes(d.getMinutes() - offset)
      setFormDate(d.toISOString().split('T')[0]);
    }
    setShowForm(true);
  }, [currentDate, resetForm]);

  const openEditForm = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormDate(event.event_date);
    setFormTime(event.event_time || '');
    setFormCategory(event.category || 'other');
    setShowForm(true);
  }, []);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formTitle || !formDate) {
      toast.error('Title and date are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEvent) {
        // UPDATE
        const { error } = await supabase
          .from('calendar_events')
          .update({
            title: formTitle,
            description: formDescription,
            event_date: formDate,
            event_time: formTime,
            category: formCategory,
          })
          .eq('id', editingEvent.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Event updated!');
      } else {
        // CREATE
        const { error } = await supabase
          .from('calendar_events')
          .insert({
            user_id: user.id,
            title: formTitle,
            description: formDescription,
            event_date: formDate,
            event_time: formTime,
            category: formCategory,
          });

        if (error) throw error;
        toast.success('Event created!');
      }

      queryClient.invalidateQueries({ queryKey: ['calendar-data', user.id] });
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Event deleted.');
      queryClient.invalidateQueries({ queryKey: ['calendar-data', user.id] });
    } catch {
      toast.error('Failed to delete event.');
    }
  };

  // Events for selected day
  const selectedDayEvents = selectedDay !== null
    ? currentMonthEvents.filter(e => e.date === selectedDay)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex justify-end -mt-6 mb-2">
        <Button onClick={() => openCreateForm()} variant="primary" size="md" icon={<Plus size={18} strokeWidth={3} />}>
          ADD EVENT
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="ss-card border-[3px] bg-neo-cream p-6 shadow-[6px_6px_0_#111111] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b-[3px] border-neo-ink pb-4 mb-6">
            <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-neo-ink">
              {editingEvent ? 'EDIT EVENT' : 'NEW EVENT'}
            </h3>
            <button 
              onClick={resetForm} 
              className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-neo-ink hover:bg-neo-coral text-neo-ink transition-colors"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
          <form onSubmit={handleSaveEvent} className="space-y-5">
            <div>
              <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Title</label>
              <input
                type="text"
                placeholder="E.G., DSA MOCK INTERVIEW PREP"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Description (Optional)</label>
              <textarea
                placeholder="ADD NOTES OR DETAILS…"
                rows={2}
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                className="w-full bg-white border-[3px] border-neo-ink p-3 text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all resize-none uppercase"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full h-[46px] bg-white border-[3px] border-neo-ink px-3 text-sm font-bold text-neo-ink focus:outline-none focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Time (Optional)</label>
                <input
                  type="time"
                  value={formTime}
                  onChange={e => setFormTime(e.target.value)}
                  className="w-full h-[46px] bg-white border-[3px] border-neo-ink px-3 text-sm font-bold text-neo-ink focus:outline-none focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormCategory(cat.value)}
                      className={`px-3 py-2 text-[10px] font-heading font-black uppercase tracking-widest border-[2px] transition-all ${
                        formCategory === cat.value
                          ? cat.color + ' shadow-[2px_2px_0_#111111]'
                          : 'bg-white text-neo-ink border-neo-ink hover:bg-neo-yellow/30'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t-[3px] border-neo-ink">
              <Button type="button" onClick={resetForm} variant="ghost" size="md">
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting || !formTitle || !formDate}>
                {submitting ? <><Loader2 size={16} strokeWidth={3} className="animate-spin mr-2" /> SAVING…</> : editingEvent ? 'UPDATE EVENT' : 'CREATE EVENT'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Calendar Grid */}
        <div className="ss-card border-[3px] bg-white p-6 lg:col-span-2 shadow-[6px_6px_0_#111111]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-[3px] border-neo-ink">
            <h2 className="text-2xl font-heading font-black text-neo-ink uppercase tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={prevMonth} 
                className="w-10 h-10 flex items-center justify-center border-[2px] border-neo-ink bg-white hover:bg-neo-yellow text-neo-ink shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] transition-all"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <button 
                onClick={nextMonth} 
                className="w-10 h-10 flex items-center justify-center border-[2px] border-neo-ink bg-white hover:bg-neo-yellow text-neo-ink shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] transition-all"
              >
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-[10px] font-heading font-black text-neo-ink uppercase tracking-widest py-2 bg-neo-surface border-[2px] border-neo-ink">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-transparent" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = i + 1;
              const isToday = date === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
              const dayEvents = currentMonthEvents.filter(e => e.date === date);
              const isSelected = selectedDay === date;

              return (
                <div
                  key={date}
                  onClick={() => setSelectedDay(isSelected ? null : date)}
                  className={cn(
                    "aspect-square flex flex-col p-1.5 transition-all cursor-pointer border-[2px] overflow-hidden",
                    isSelected 
                      ? "border-neo-ink bg-neo-yellow shadow-[4px_4px_0_#111111] -translate-y-1 -translate-x-1" 
                      : isToday 
                        ? "border-neo-ink bg-neo-purple/10" 
                        : "border-neo-ink bg-white hover:bg-neo-surface"
                  )}
                >
                  <span className={cn(
                    "text-sm font-heading font-black mb-1 leading-none", 
                    isToday ? "text-neo-purple" : "text-neo-ink"
                  )}>
                    {date}
                  </span>
                  <div className="mt-auto space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event, idx) => (
                      <div key={idx} className={cn(
                        "px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider truncate border-[1px]",
                        event.source === 'session'
                          ? (event.type === 'teaching' ? 'bg-neo-yellow text-neo-ink border-neo-ink' : 'bg-neo-coral text-white border-neo-ink')
                          : getCategoryStyle(event.type)
                      )}>
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] font-bold text-center text-neo-ink/50 uppercase tracking-widest">
                        +{dayEvents.length - 2} MORE
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Selected Day / Upcoming */}
        <div className="ss-card border-[3px] bg-neo-surface p-6 sticky top-6 shadow-[6px_6px_0_#111111]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-[3px] border-neo-ink">
            <div className="flex items-center gap-3">
              <CalendarIcon size={24} strokeWidth={2.5} className="text-neo-purple" />
              <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink">
                {selectedDay !== null
                  ? `${currentDate.toLocaleString('default', { month: 'short' })} ${selectedDay}`
                  : 'UPCOMING'}
              </h3>
            </div>
            {selectedDay !== null && (
               <button
                 onClick={() => openCreateForm(selectedDay)}
                 className="w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink bg-white hover:bg-neo-yellow text-neo-ink shadow-[2px_2px_0_#111111] transition-all"
                 title="Add event on this day"
               >
                 <Plus size={16} strokeWidth={3} />
               </button>
             )}
           </div>
 
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-8 gap-4">
               <Loader2 size={24} className="animate-spin text-neo-purple" />
             </div>
           ) : (selectedDay !== null ? selectedDayEvents : allEvents).length === 0 ? (
             <div className="text-center py-12">
               <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/60 mb-4">
                 {selectedDay !== null ? 'NO EVENTS ON THIS DAY.' : 'NO UPCOMING SESSIONS.'}
               </p>
               {selectedDay !== null && (
                 <Button
                   onClick={() => openCreateForm(selectedDay)}
                   variant="primary" size="sm"
                 >
                   ADD EVENT
                 </Button>
               )}
             </div>
           ) : (
             <div className="space-y-4">
               {(selectedDay !== null ? selectedDayEvents : allEvents).map((event) => (
                 <div key={event.id} className="p-4 border-[3px] border-neo-ink bg-white group hover:shadow-[4px_4px_0_#111111] hover:-translate-y-1 transition-all">
                   <div className="flex items-start justify-between mb-3">
                     <h4 className="text-lg font-heading font-black text-neo-ink line-clamp-1 uppercase tracking-tight" title={event.title}>{event.title}</h4>
                   </div>
                   
                   <div className="flex items-center gap-2 mb-3">
                     <span className={cn(
                       "text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest border-[2px]",
                       event.source === 'session'
                         ? (event.type === 'teaching' ? 'bg-neo-yellow text-neo-ink border-neo-ink' : 'bg-neo-coral text-white border-neo-ink')
                         : getCategoryStyle(event.type)
                     )}>
                       {event.source === 'session' ? event.type : event.status}
                     </span>
                   </div>
 
                   {'description' in event && event.description && (
                     <p className="text-xs font-medium text-neo-ink/80 mb-3 line-clamp-2 uppercase">{event.description}</p>
                   )}
                   
                   <div className="flex items-center justify-between pt-3 border-t-[2px] border-neo-ink/20">
                     <div className="flex flex-col gap-1.5 text-[10px] font-bold text-neo-ink/70 uppercase tracking-widest">
                       <div className="flex items-center gap-2">
                         <CalendarIcon size={12} strokeWidth={3} /> {event.date} {new Date(event.year, event.month).toLocaleString('default', { month: 'short' }).toUpperCase()}
                       </div>
                       {event.time && (
                         <div className="flex items-center gap-2">
                           <Clock size={12} strokeWidth={3} /> {event.time}
                         </div>
                       )}
                     </div>
 
                     {/* CRUD buttons for custom events */}
                     {event.source === 'custom' && (
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                           onClick={() => {
                             const original = data?.events.find(ev => ev.id === event.id);
                             if (original) openEditForm(original);
                           }}
                           className="w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink bg-white hover:bg-neo-yellow text-neo-ink shadow-[2px_2px_0_#111111]"
                           title="Edit event"
                         >
                           <Pencil size={12} strokeWidth={3} />
                         </button>
                         <button
                           onClick={() => handleDeleteEvent(event.id)}
                           className="w-8 h-8 flex items-center justify-center border-[2px] border-neo-ink bg-white hover:bg-neo-coral hover:text-white text-neo-ink shadow-[2px_2px_0_#111111]"
                           title="Delete event"
                         >
                           <Trash2 size={12} strokeWidth={3} />
                         </button>
                       </div>
                     )}
                   </div>
 
                   {event.source === 'session' && event.status === 'active' && (
                     <Link href={`/dashboard/sessions/${event.id}`} className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-[2px] border-neo-ink bg-neo-green text-neo-ink hover:bg-neo-green/90 shadow-[2px_2px_0_#111111] transition-all text-sm font-heading font-black uppercase tracking-widest active:shadow-none active:translate-y-[2px]">
                       <Video size={16} strokeWidth={3} /> JOIN CALL
                     </Link>
                   )}
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }
