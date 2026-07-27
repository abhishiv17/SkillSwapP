'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon, 
  className, 
  children, 
  disabled, 
  ...props 
}: ButtonProps) {
  
  const baseClasses = "inline-flex items-center justify-center font-heading font-bold uppercase tracking-widest transition-all ss-button-press disabled:opacity-50 disabled:pointer-events-none gap-2";
  
  const sizeClasses = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-6 text-sm",
    lg: "h-14 px-8 text-base",
  };
  
  const variantClasses = {
    primary: "bg-neo-purple text-white border-[2px] border-neo-ink shadow-[3px_3px_0_#111111]",
    secondary: "bg-neo-cream text-neo-ink border-[2px] border-neo-ink shadow-[3px_3px_0_#111111]",
    success: "bg-neo-green text-neo-ink border-[2px] border-neo-ink shadow-[3px_3px_0_#111111]",
    warning: "bg-neo-yellow text-neo-ink border-[2px] border-neo-ink shadow-[3px_3px_0_#111111]",
    danger: "bg-neo-coral text-neo-ink border-[2px] border-neo-ink shadow-[3px_3px_0_#111111]",
    ghost: "bg-transparent text-neo-ink border-2 border-transparent hover:border-neo-ink hover:bg-black/5 hover:shadow-none active:shadow-none active:translate-y-0 active:translate-x-0",
  };

  return (
    <button 
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} /> : icon}
      {children}
    </button>
  );
}
