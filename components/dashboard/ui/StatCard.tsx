import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'purple' | 'green' | 'yellow' | 'coral' | 'blue' | 'cream';
  className?: string;
}

export function StatCard({ title, value, icon: Icon, color = 'cream', className }: StatCardProps) {
  
  const bgColors = {
    purple: 'bg-neo-purple text-white',
    green: 'bg-neo-green text-neo-ink',
    yellow: 'bg-neo-yellow text-neo-ink',
    coral: 'bg-neo-coral text-neo-ink',
    blue: 'bg-neo-blue text-neo-ink',
    cream: 'bg-neo-cream text-neo-ink',
  };

  const iconColors = {
    purple: 'text-neo-purple',
    green: 'text-neo-green',
    yellow: 'text-neo-yellow',
    coral: 'text-neo-coral',
    blue: 'text-neo-blue',
    cream: 'text-neo-ink',
  };

  return (
    <div className={cn("ss-card p-5 flex flex-col justify-between min-h-[110px]", bgColors[color], className)}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-heading font-bold text-sm uppercase tracking-widest opacity-80 max-w-[120px] leading-tight">
          {title}
        </h3>
        <div className="w-8 h-8 rounded-md bg-white border-2 border-neo-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0_#111111]">
          <Icon size={16} className="text-neo-ink" strokeWidth={2.5} />
        </div>
      </div>
      <div className="font-heading font-black text-4xl leading-none">
        {value}
      </div>
    </div>
  );
}
