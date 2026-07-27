import { Zap, Users, Video, ShieldCheck, Star, Coins, Award, MessageCircle, Library, Sparkles } from 'lucide-react';
import { NeoCard } from '@/components/shared/NeoCard';

const features = [
  {
    num: '01',
    icon: Sparkles,
    title: 'AI SKILL RECOMMENDATIONS',
    description: 'Our Llama 3.1 powered AI analyzes your profile to suggest the perfect skills to learn next.',
    color: 'green',
  },
  {
    num: '02',
    icon: Award,
    title: 'BADGES & MILESTONES',
    description: 'Earn unique badges for teaching, learning, and hitting milestones. Showcase your expertise.',
    color: 'yellow',
  },
  {
    num: '03',
    icon: MessageCircle,
    title: 'COMMUNITY FORUM',
    description: 'Discuss topics, ask for help, and share solutions. A dedicated space for collaborative learning.',
    color: 'purple',
  },
  {
    num: '04',
    icon: Library,
    title: 'RESOURCE LIBRARY',
    description: 'Share and discover videos, articles, and e-books. A crowdsourced repository of knowledge.',
    color: 'blue',
  },
  {
    num: '05',
    icon: Video,
    title: 'IN-APP VIDEO CALLS',
    description: 'Jump directly into live peer-to-peer sessions using integrated WebRTC video — no third-party apps required.',
    color: 'coral',
  },
  {
    num: '06',
    icon: Coins,
    title: 'SKILL CREDIT ECONOMY',
    description: 'Earn credits by teaching what you know, then spend them to learn what you want.',
    color: 'white',
  },
] as const;

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-neo-purple text-neo-ink border-b-[4px] border-neo-ink">
      <div className="mx-auto w-full max-w-[1440px] px-6">
        
        {/* Section Header */}
        <div className="mb-20">
          <h2 className="font-heading text-4xl sm:text-5xl md:text-[4rem] font-black leading-none uppercase text-white" style={{ WebkitTextStroke: '2px #111111' }}>
            EVERYTHING YOU NEED
            <br />
            <span className="text-neo-yellow">TO LEARN & TEACH.</span>
          </h2>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <NeoCard 
                key={feature.title} 
                bgColor={feature.color as any} 
                className="p-6 sm:p-8 flex flex-col min-h-[280px] neo-hover-lift shadow-[6px_6px_0_#111111]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white border-[3px] border-neo-ink rounded-md flex items-center justify-center shadow-[4px_4px_0_#111111] flex-shrink-0">
                    <Icon size={28} className="text-neo-ink" strokeWidth={2.5} />
                  </div>
                  <span className="font-heading font-black text-4xl sm:text-5xl opacity-40 mix-blend-multiply">
                    {feature.num}
                  </span>
                </div>
                
                <h3 className="font-heading font-black text-xl text-neo-ink mb-4 uppercase tracking-wide">
                  {feature.title}
                </h3>
                
                <p className="text-base text-neo-ink font-medium leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </NeoCard>
            );
          })}
        </div>

      </div>
    </section>
  );
}
