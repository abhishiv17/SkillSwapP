'use client';

import { useState, useEffect } from 'react';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { UserPlus, Video, Users, Award } from 'lucide-react';
import { NeoCard } from '@/components/shared/NeoCard';

const steps = [
  { number: '01', icon: UserPlus, title: 'BUILD YOUR PROFILE', description: 'List your skills. Our Llama 3.1 AI will suggest what to learn next.', color: 'green' },
  { number: '02', icon: Users, title: 'CONNECT & ENGAGE', description: 'Join the Community Forum to discuss topics or find matches.', color: 'yellow' },
  { number: '03', icon: Video, title: 'LEARN & TEACH', description: 'Jump into integrated video sessions. Earn credits & master skills.', color: 'coral' },
  { number: '04', icon: Award, title: 'UNLOCK BADGES', description: 'Climb the leaderboard and celebrate your growth milestones.', color: 'blue' },
] as const;

export function HowItWorks() {
  const [stats, setStats] = useState([
    { value: 0, suffix: '+', label: 'STUDENTS', color: 'bg-neo-purple' },
    { value: 0, suffix: '+', label: 'SESSIONS', color: 'bg-neo-green' },
    { value: 0, suffix: '+', label: 'SKILLS LISTED', color: 'bg-neo-yellow' },
    { value: 0, suffix: '', label: 'AVG RATING', decimals: 1, prefix: '★ ', color: 'bg-neo-coral' },
  ]);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(prev => [
          { ...prev[0], value: data.users || 0 },
          { ...prev[1], value: data.sessions || 0 },
          { ...prev[2], value: data.skills || 0 },
          { ...prev[3], value: data.avgRating || 4.7 },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-neo-cream border-b-[4px] border-neo-ink">
      <div className="mx-auto w-full max-w-[1440px] px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-neo-ink uppercase leading-none max-w-2xl">
            FOUR STEPS TO YOUR<br/>
            FIRST SKILL SWAP.
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-32">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <NeoCard 
                key={step.number} 
                bgColor={step.color as any} 
                className="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 neo-hover-lift shadow-[6px_6px_0_#111111]"
              >
                <div className="flex flex-col items-center flex-shrink-0 gap-4">
                  <span className="font-heading font-black text-5xl text-neo-ink opacity-40 mix-blend-multiply leading-none">
                    {step.number}
                  </span>
                  <div className="w-16 h-16 bg-white border-[3px] border-neo-ink rounded-md flex items-center justify-center shadow-[4px_4px_0_#111111]">
                    <Icon size={32} className="text-neo-ink" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-heading font-black text-2xl text-neo-ink mb-2 uppercase tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-lg text-neo-ink font-medium leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </NeoCard>
            );
          })}
        </div>

        {/* Stats Section */}
        <div id="stats" className="border-t-[4px] border-neo-ink border-dashed pt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                className={`border-[4px] border-neo-ink ${stat.color} p-8 rounded-md shadow-[6px_6px_0_#111111] text-center flex flex-col justify-center min-h-[200px]`}
              >
                <div className="font-heading text-5xl sm:text-6xl lg:text-[4rem] font-black text-white mb-4" style={{ WebkitTextStroke: '2px #111111' }}>
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals ?? 0}
                    prefix={stat.prefix}
                  />
                </div>
                <p className="text-base sm:text-lg font-heading font-bold text-neo-ink uppercase tracking-widest bg-white border-[3px] border-neo-ink inline-block px-4 py-2 rounded-sm shadow-[4px_4px_0_#111111] mx-auto">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
