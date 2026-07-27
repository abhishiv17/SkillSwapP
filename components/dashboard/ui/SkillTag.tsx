import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SkillTagProps {
  skill: string;
  className?: string;
  color?: 'default' | 'purple' | 'green' | 'yellow' | 'coral' | 'blue';
}

export function SkillTag({ skill, className, color = 'default' }: SkillTagProps) {
  const colorClasses = {
    default: 'bg-white text-neo-ink border-neo-ink',
    purple: 'bg-neo-purple text-white border-neo-ink',
    green: 'bg-neo-green text-neo-ink border-neo-ink',
    yellow: 'bg-neo-yellow text-neo-ink border-neo-ink',
    coral: 'bg-neo-coral text-neo-ink border-neo-ink',
    blue: 'bg-neo-blue text-neo-ink border-neo-ink',
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-xs font-heading font-bold uppercase tracking-widest border-2 rounded-sm whitespace-nowrap",
        colorClasses[color],
        className
      )}
    >
      {skill}
    </span>
  );
}
