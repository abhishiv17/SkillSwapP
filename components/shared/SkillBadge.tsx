import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SkillBadgeProps {
  skill: string;
  variant?: 'default' | 'have' | 'want' | 'match';
  size?: 'sm' | 'md';
  className?: string;
  onRemove?: () => void;
}

const variantStyles = {
  default: 'bg-white text-neo-ink border-neo-ink',
  have: 'bg-neo-green text-neo-ink border-neo-ink',
  want: 'bg-neo-purple text-white border-neo-ink',
  match: 'bg-neo-coral text-white border-neo-ink',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-[10px] gap-1',
  md: 'px-3 py-1.5 text-xs gap-1.5',
};

export function SkillBadge({ skill, variant = 'default', size = 'sm', className, onRemove }: SkillBadgeProps) {
  return (
    <span className={cn('inline-flex items-center border-[2px] font-heading font-black uppercase tracking-widest shadow-[2px_2px_0_#111111]', variantStyles[variant], sizeStyles[size], className)}>
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          className="hover:scale-110 active:scale-95 transition-transform ml-1 focus:outline-none"
          aria-label={`Remove ${skill}`}
        >
          <X size={size === 'sm' ? 12 : 14} strokeWidth={3} />
        </button>
      )}
    </span>
  );
}
