import { HTMLAttributes, forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface SkillStickerProps extends HTMLAttributes<HTMLDivElement> {
  skill: string;
}

const colors = ['bg-neo-green', 'bg-neo-yellow', 'bg-neo-blue', 'bg-neo-coral', 'bg-neo-purple'];

export const SkillSticker = forwardRef<HTMLDivElement, SkillStickerProps>(
  ({ className, skill, ...props }, ref) => {
    // Generate a consistent random color and rotation based on the string length/chars
    const colorIndex = skill.length % colors.length;
    const bgColor = colors[colorIndex];
    
    // Rotation between -3 and 3 degrees
    const rotation = (skill.charCodeAt(0) % 7) - 3;

    return (
      <div
        ref={ref}
        className={cn(
          'inline-block px-4 py-2 border-[2px] border-neo-ink rounded-sm font-heading font-bold uppercase text-sm cursor-default neo-hover-lift neo-shadow-sm',
          bgColor,
          // If the color is purple, text should be white for contrast
          bgColor === 'bg-neo-purple' ? 'text-white' : 'text-neo-ink',
          className
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
        {...props}
      >
        [ {skill} ]
      </div>
    );
  }
);
SkillSticker.displayName = 'SkillSticker';
