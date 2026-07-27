import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center ss-card border-dashed bg-white/50", className)}>
      <div className="w-16 h-16 rounded-xl border-[3px] border-neo-ink flex items-center justify-center mb-6 bg-neo-cream shadow-[4px_4px_0_#111111]">
        <Icon size={32} className="text-neo-ink opacity-80" strokeWidth={2} />
      </div>
      <h3 className="font-heading font-black text-2xl text-neo-ink uppercase mb-2">
        {title}
      </h3>
      <p className="text-neo-ink/70 font-medium max-w-md mx-auto mb-8">
        {description}
      </p>
      {action}
    </div>
  );
}
