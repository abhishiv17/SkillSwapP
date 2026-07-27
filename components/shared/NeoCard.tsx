import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface NeoCardProps extends HTMLAttributes<HTMLDivElement> {
  bgColor?: 'cream' | 'green' | 'yellow' | 'purple' | 'blue' | 'coral' | 'orange' | 'white';
}

export const NeoCard = forwardRef<HTMLDivElement, NeoCardProps>(
  ({ className, bgColor = 'cream', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border-[3px] border-neo-ink rounded-lg neo-shadow-md',
          {
            'bg-neo-cream': bgColor === 'cream',
            'bg-neo-green': bgColor === 'green',
            'bg-neo-yellow': bgColor === 'yellow',
            'bg-neo-purple': bgColor === 'purple',
            'bg-neo-blue': bgColor === 'blue',
            'bg-neo-coral': bgColor === 'coral',
            'bg-neo-orange': bgColor === 'orange',
            'bg-white': bgColor === 'white',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NeoCard.displayName = 'NeoCard';
