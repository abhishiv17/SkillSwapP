'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  UserCircle,
  Star,
  Trophy,
  LogOut,
  ChevronLeft,
  MessageSquare,
  Calendar,
  FileQuestion,
  Menu,
  X,
  Library,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const mainNavItems = [
  { label: 'MARKETPLACE', href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'CAMPUS HUB', href: ROUTES.campus, icon: FileQuestion },
  { label: 'LIBRARY', href: ROUTES.library, icon: Library },
];

const connectionNavItems = [
  { label: 'SESSIONS', href: ROUTES.sessions, icon: CalendarDays },
  { label: 'MESSAGES', href: ROUTES.messages, icon: MessageSquare },
];

const userNavItems = [
  { label: 'PROFILE', href: ROUTES.profile, icon: UserCircle },
  { label: 'REVIEWS', href: ROUTES.reviews, icon: Star },
  { label: 'LEADERBOARD', href: ROUTES.leaderboard, icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useUser();

  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${profile?.username || profile?.full_name || 'User'}&backgroundColor=FFF9E9`;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const renderNavGroup = (items: { label: string; href: string; icon: any }[]) => (
    <div className="flex flex-col gap-1.5 mb-6 last:mb-0">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 h-[44px] rounded-md text-sm font-heading font-bold transition-all border-[2px]',
              isActive
                ? 'bg-neo-purple text-white border-neo-ink shadow-[3px_3px_0_#111111] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-transparent text-neo-ink border-transparent hover:bg-neo-yellow hover:border-neo-ink hover:shadow-[3px_3px_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px]',
              collapsed && 'justify-center px-0'
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-5 py-6 border-b-[3px] border-neo-ink bg-neo-cream hover:bg-neo-yellow transition-colors">
        <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-neo-purple border-[2px] border-neo-ink rounded-md shadow-[2px_2px_0_#111111]">
          <span className="text-white font-heading font-black text-xl">S</span>
        </div>
        {!collapsed && (
          <span className="font-heading font-black text-xl text-neo-ink uppercase tracking-tight truncate">
            {APP_NAME}
          </span>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto bg-neo-cream">
        {renderNavGroup(mainNavItems)}
        <div className="h-[3px] bg-neo-ink/10 mb-6 mx-2" />
        {renderNavGroup(connectionNavItems)}
        <div className="h-[3px] bg-neo-ink/10 mb-6 mx-2" />
        {renderNavGroup(userNavItems)}
      </nav>

      {/* User section */}
      <div className="p-4 border-t-[3px] border-neo-ink bg-neo-cream">
        <div className={cn('flex items-center gap-3 p-2 bg-white border-[2px] border-neo-ink rounded-md shadow-[3px_3px_0_#111111]', collapsed && 'justify-center')}>
          <Image
            src={avatarUrl}
            alt={profile?.username || 'User'}
            width={36}
            height={36}
            className="w-9 h-9 rounded-md bg-neo-cream border-2 border-neo-ink shrink-0"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-bold text-neo-ink truncate uppercase">
                {profile ? (profile.username || profile.full_name || 'User') : 'Loading...'}
              </p>
              <p className="text-xs font-bold text-neo-green truncate px-1.5 py-0.5 bg-neo-ink inline-block rounded-sm mt-0.5">
                {profile?.credits ?? 0} CREDITS
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 px-3 h-[40px] mt-4 w-full rounded-md text-sm font-heading font-bold text-neo-ink border-[2px] border-transparent hover:border-neo-ink hover:bg-neo-coral hover:shadow-[3px_3px_0_#111111] transition-all uppercase"
          >
            <LogOut size={16} strokeWidth={2.5} />
            Sign Out
          </button>
        )}
      </div>

      {/* Desktop Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-4 top-8 w-8 h-8 rounded-md bg-neo-cream border-[3px] border-neo-ink items-center justify-center text-neo-ink hover:bg-neo-yellow shadow-[2px_2px_0_#111111] transition-all z-10"
        aria-label="Toggle sidebar"
      >
        <ChevronLeft size={16} strokeWidth={3} className={cn('transition-transform', collapsed && 'rotate-180')} />
      </button>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 flex items-center justify-center rounded-md bg-neo-cream border-[3px] border-neo-ink shadow-[2px_2px_0_#111111] text-neo-ink"
        aria-label="Open menu"
      >
        <Menu size={20} strokeWidth={2.5} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-neo-ink/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col bg-neo-cream border-r-[3px] border-neo-ink transition-all duration-300',
          collapsed ? 'w-[80px]' : 'w-[240px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-neo-cream border-r-[3px] border-neo-ink w-[280px] transition-transform duration-300 lg:hidden shadow-[10px_0_0_rgba(17,17,17,0.1)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header X */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-5 w-8 h-8 flex items-center justify-center rounded-md border-[2px] border-neo-ink hover:bg-neo-coral transition-colors z-10"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
