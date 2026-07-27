'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NeoButton } from '@/components/shared/NeoButton';
import { ROUTES } from '@/lib/constants';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { SkillSticker } from '@/components/landing/SkillSticker';
import { SkillExchangeBoard } from '@/components/landing/SkillExchangeBoard';

export function Hero() {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setUserCount(data.users))
      .catch(() => setUserCount(47));
  }, []);

  return (
    <section className="relative min-h-[calc(100svh-84px)] mt-[84px] py-12 lg:py-20 flex items-center overflow-hidden bg-neo-cream border-b-[4px] border-neo-ink">
      <div className="mx-auto w-full max-w-[1440px] px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* LEFT COLUMN: 55% */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-10 w-full">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neo-yellow border-[3px] border-neo-ink rounded-full shadow-[2px_2px_0_#111111] mb-8 lg:mb-10 animate-fade-in">
            <div className="w-3 h-3 rounded-full bg-neo-ink animate-pulse" />
            <span className="font-heading font-black uppercase text-sm tracking-widest text-neo-ink">
              <AnimatedCounter target={userCount} /> students swapping skills
            </span>
          </div>

          <h1 
            className="font-heading font-black text-neo-ink uppercase mb-8 leading-[0.88] tracking-[-0.05em] w-full"
            style={{ fontSize: 'clamp(56px, 7vw, 112px)' }}
          >
            <span className="block mb-2">SWAP SKILLS.</span>
            <span className="inline-block bg-neo-green px-4 py-1 border-[4px] border-neo-ink shadow-[6px_6px_0_#111111] -rotate-1 text-neo-ink relative z-10">
              NOT CASH.
            </span>
          </h1>

          <p className="max-w-xl text-lg md:text-xl text-neo-ink font-bold leading-relaxed mb-10 border-l-[4px] border-neo-purple pl-6">
            Master new skills through peer exchange.<br/>
            Teach what you know. Learn what you don&apos;t.<br/>
            No cash required.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-12 w-full sm:w-auto">
            <Link href={ROUTES.signup} className="w-full sm:w-auto">
              <NeoButton size="lg" className="w-full">
                START SWAPPING &rarr;
              </NeoButton>
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto">
              <NeoButton variant="secondary" size="lg" className="w-full">
                HOW IT WORKS
              </NeoButton>
            </Link>
          </div>

          {/* Skill Stickers */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            <SkillSticker skill="CODE" />
            <SkillSticker skill="DESIGN" />
            <SkillSticker skill="日本語" />
            <SkillSticker skill="MUSIC" />
            <SkillSticker skill="PHOTOGRAPHY" />
            <SkillSticker skill="REACT" />
          </div>
          
        </div>

        {/* RIGHT COLUMN: 45% (Skill Exchange Board) */}
        <div className="lg:col-span-5 w-full flex items-center justify-center lg:justify-end relative z-0 mt-8 lg:mt-0">
          <SkillExchangeBoard />
        </div>

      </div>
    </section>
  );
}
