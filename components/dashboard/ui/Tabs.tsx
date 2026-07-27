import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-0 border-[3px] border-neo-ink rounded-md overflow-hidden bg-neo-cream w-max", className)}>
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-6 py-3 font-heading font-bold text-sm uppercase tracking-widest transition-colors border-r-[3px] border-neo-ink last:border-r-0",
              isActive 
                ? "bg-neo-purple text-white" 
                : "bg-transparent text-neo-ink hover:bg-black/5"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
