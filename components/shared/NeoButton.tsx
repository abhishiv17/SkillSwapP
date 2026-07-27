import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

export interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'white';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export const NeoButton = forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-heading font-bold uppercase tracking-wide border-[3px] border-neo-ink rounded-md neo-shadow-sm neo-active-press transition-all',
          {
            'bg-neo-green text-neo-ink': variant === 'primary',
            'bg-neo-cream text-neo-ink': variant === 'secondary',
            'bg-neo-purple text-white': variant === 'accent',
            'bg-white text-neo-ink': variant === 'white',
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg border-[4px]': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
NeoButton.displayName = 'NeoButton';
