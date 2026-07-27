import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b-[3px] border-neo-ink/10", className)}>
      <div className="max-w-2xl">
        <h1 className="font-heading font-black text-3xl md:text-4xl text-neo-ink uppercase tracking-tight mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-neo-ink/70 font-medium text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
