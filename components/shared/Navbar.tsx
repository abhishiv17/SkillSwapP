'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NeoButton } from '@/components/shared/NeoButton';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '@/components/shared/LanguageSelector';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Stats', href: '#stats' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-neo-cream border-b-[3px] border-neo-ink transition-all duration-300',
        scrolled ? 'h-[76px]' : 'h-[84px]'
      )}
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 h-full flex items-center justify-between">
        
        {/* Logo and Wordmark - ONE LINE */}
        <Link href={ROUTES.home} className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 flex items-center justify-center bg-neo-purple border-[3px] border-neo-ink rounded-md transition-transform group-hover:rotate-6 shadow-[2px_2px_0_#111111]">
            <span className="text-white font-heading font-black text-lg">S</span>
          </div>
          <span className="font-heading font-black text-2xl uppercase text-neo-ink tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Navigation - ONE LINE */}
        <div className="hidden lg:flex items-center justify-center gap-8 flex-grow">
          {navLinks.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="text-sm font-heading font-bold text-neo-ink hover:text-neo-purple uppercase tracking-widest relative group whitespace-nowrap"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[3px] bg-neo-purple transition-all group-hover:w-full"></span>
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
          <LanguageSelector />
          <Link href={ROUTES.login} prefetch={false} className="text-sm font-heading font-bold text-neo-ink uppercase tracking-widest hover:text-neo-purple">
            Log in
          </Link>
          <Link href={ROUTES.signup} prefetch={false}>
            <NeoButton variant="primary" size="sm">Get Started</NeoButton>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex lg:hidden items-center gap-4">
          <button 
            className="text-neo-ink p-2 border-[2px] border-neo-ink rounded-md shadow-[2px_2px_0_#111111]" 
            onClick={() => setMobileOpen(!mobileOpen)} 
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-neo-cream border-b-[3px] border-neo-ink p-6 flex flex-col gap-6 shadow-[0_8px_0_#111111]">
          {navLinks.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              onClick={() => setMobileOpen(false)} 
              className="text-lg font-heading font-black uppercase text-neo-ink tracking-wide border-b-[3px] border-neo-ink pb-2"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-4 mt-2">
            <Link href={ROUTES.login} prefetch={false} onClick={() => setMobileOpen(false)}>
              <NeoButton variant="secondary" size="md" className="w-full">Log in</NeoButton>
            </Link>
            <Link href={ROUTES.signup} prefetch={false} onClick={() => setMobileOpen(false)}>
              <NeoButton variant="primary" size="md" className="w-full">Get Started</NeoButton>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
