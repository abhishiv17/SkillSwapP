'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { useNotifications } from '@/hooks/useNotifications';
import { ROUTES } from '@/lib/constants';
import { Search, Bell, Coins, UserPlus, Star, CalendarCheck, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '@/components/shared/LanguageSelector';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'JUST NOW';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'session_request':
      return <UserPlus size={16} strokeWidth={2.5} className="text-neo-ink" />;
    case 'session_accepted':
      return <CalendarCheck size={16} strokeWidth={2.5} className="text-neo-ink" />;
    case 'review_received':
      return <Star size={16} strokeWidth={2.5} className="text-neo-ink" />;
    default:
      return <Bell size={16} strokeWidth={2.5} className="text-neo-ink" />;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'session_request': return 'bg-neo-purple text-white';
    case 'session_accepted': return 'bg-neo-green text-neo-ink';
    case 'review_received': return 'bg-neo-yellow text-neo-ink';
    default: return 'bg-white border-2 border-neo-ink';
  }
}

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { profile } = useUser();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    let isMounted = true;
    if (searchQuery.trim().length > 1) {
      setShowSearchDropdown(true);
      const fetchResults = async () => {
        setIsSearching(true);
        try {
          const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
          const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, college_name')
            .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
            .limit(5);
            
          if (isMounted) {
            setSearchResults(data || []);
          }
        } catch (err: any) {
          console.error('Search error', err);
        } finally {
          if (isMounted) setIsSearching(false);
        }
      };
      const timeoutId = setTimeout(fetchResults, 300);
      return () => {
        clearTimeout(timeoutId);
        isMounted = false;
      };
    } else {
      setShowSearchDropdown(false);
      setSearchResults([]);
    }
    return () => { isMounted = false; };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-neo-cream border-b-[3px] border-neo-ink px-4 sm:px-8 py-4 h-[76px] flex items-center">
      <div className="flex items-center justify-between w-full gap-4 max-w-[1500px] mx-auto">
        
        {/* Spacer for hamburger on mobile */}
        <div className="w-12 lg:hidden shrink-0" />

        {/* Global Search */}
        <div className="relative flex-1 max-w-[500px] hidden sm:block" ref={searchRef}>
          <Search size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-neo-ink" />
          <input
            type="text"
            placeholder="Search students, skills, resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchQuery.length > 1) setShowSearchDropdown(true) }}
            className="w-full pl-11 pr-4 h-[44px] rounded-md bg-white border-[2px] border-neo-ink text-neo-ink placeholder:text-neo-ink/50 text-sm font-bold focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[2px_2px_0_var(--ss-purple)] transition-all uppercase tracking-wide"
          />
          
          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full mt-3 w-full bg-neo-cream border-[3px] border-neo-ink rounded-md shadow-[6px_6px_0_#111111] overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-center font-heading font-bold uppercase text-neo-ink">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.map((user) => (
                    <Link 
                      key={user.id} 
                      href={`/dashboard/user/${user.id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center gap-3 p-3 hover:bg-neo-yellow border-b-[2px] border-neo-ink last:border-b-0 transition-colors"
                    >
                      <Image 
                        src={`https://api.dicebear.com/9.x/bottts/svg?seed=${user.username || user.id}&backgroundColor=FFF9E9`} 
                        alt={user.username || 'User Avatar'} width={36} height={36} className="rounded-md border-2 border-neo-ink bg-white" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-heading font-black uppercase text-neo-ink truncate">{user.full_name || user.username}</p>
                        <p className="text-[10px] font-bold text-neo-ink/60 truncate uppercase">@{user.username} • {user.college_name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center font-heading font-bold uppercase text-neo-ink">No students found</div>
              )}
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          
          <div className="hidden md:block">
            {/* We will wrap LanguageSelector slightly or rely on its own styling, 
                ideally applying some neo-brutalist wrapper if it's external, but we'll leave it as is if it's shared. */}
            <LanguageSelector />
          </div>

          {/* Credits */}
          <Link 
            href={ROUTES.dashboard} 
            className="flex items-center justify-center gap-2 px-4 h-[44px] rounded-md bg-neo-yellow border-[2px] border-neo-ink ss-button-press"
          >
            <Coins size={18} strokeWidth={2.5} className="text-neo-ink" />
            <span className="text-sm font-heading font-black text-neo-ink mt-0.5">
              {profile?.credits ?? 0}
            </span>
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "relative flex items-center justify-center w-[44px] h-[44px] rounded-md border-[2px] border-neo-ink ss-button-press transition-colors",
                showNotifications || unreadCount > 0 ? "bg-neo-purple text-white" : "bg-white text-neo-ink hover:bg-neo-yellow"
              )}
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-neo-coral text-neo-ink text-[11px] font-black px-1 border-2 border-neo-ink">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] bg-neo-cream border-[3px] border-neo-ink rounded-md shadow-[6px_6px_0_#111111] overflow-hidden z-50 flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="px-4 py-3 border-b-[3px] border-neo-ink bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-base text-neo-ink uppercase tracking-tight">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-sm bg-neo-purple text-white text-[10px] font-bold uppercase">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs font-bold text-neo-ink hover:text-neo-purple uppercase flex items-center gap-1">
                        <CheckCheck size={14} strokeWidth={3} /> Read all
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={clearAll} className="text-neo-ink hover:text-neo-coral transition-colors" title="Clear all">
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications list */}
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-12 text-center text-neo-ink flex flex-col items-center justify-center bg-white">
                      <Bell size={32} strokeWidth={2} className="mb-3 opacity-30" />
                      <p className="font-heading font-bold uppercase text-lg">No notifications yet</p>
                      <p className="text-xs font-medium mt-1 opacity-70">They will appear here in real-time</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.link || '#'}
                        onClick={() => {
                          if (!notification.is_read) markAsRead(notification.id);
                          setShowNotifications(false);
                        }}
                        className={cn(
                          'flex items-start gap-4 px-4 py-4 transition-colors border-b-[2px] border-neo-ink last:border-b-0',
                          !notification.is_read ? 'bg-neo-purple/5 hover:bg-neo-purple/10' : 'bg-white hover:bg-neo-cream'
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          'w-10 h-10 rounded-md flex items-center justify-center shrink-0 border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]',
                          getNotificationColor(notification.type)
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neo-ink leading-snug">
                            <span className="font-bold">{notification.title}</span>{' '}
                            {notification.message}
                          </p>
                          <p className="text-[10px] font-bold text-neo-ink/50 mt-1 uppercase tracking-wider">
                            {timeAgo(notification.created_at)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="w-3 h-3 rounded-full bg-neo-purple border-[2px] border-neo-ink shrink-0 mt-1" />
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
