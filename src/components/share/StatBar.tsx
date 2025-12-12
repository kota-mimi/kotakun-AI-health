import React from 'react';
import { FontStyleId } from '../../types/dailyLog';

interface StatBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  colorClass: string; // Tailwind text color class
  isDarkMode?: boolean;
  fontStyle?: FontStyleId;
  numberColor?: string;
}

export const StatBar: React.FC<StatBarProps> = ({ 
  label, 
  current, 
  target, 
  unit, 
  colorClass,
  isDarkMode = true,
  fontStyle = 'standard',
  numberColor = 'auto'
}) => {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  
  // Create segments for the digital gauge look
  const totalSegments = 24;
  const filledSegments = Math.round((percentage / 100) * totalSegments);
  
  const getFontClasses = () => {
    switch (fontStyle) {
      case 'sketch': return { label: 'font-hand text-[11px] font-bold tracking-[0.1em]', val: 'font-hand text-sm' };
      case 'marker': return { label: 'font-marker text-[11px] font-bold tracking-[0.1em]', val: 'font-marker text-sm' };
      case 'pen': return { label: 'font-pen text-[11px] font-bold tracking-[0.1em]', val: 'font-pen text-sm' };
      case 'novel': return { label: 'font-serif text-[10px] font-bold tracking-[0.2em]', val: 'font-serif text-sm' };
      case 'pixel': return { label: 'font-pixel text-[10px] tracking-[0.1em]', val: 'font-pixel text-xs' };
      case 'cute': return { label: 'font-cute text-[10px] tracking-[0.1em]', val: 'font-cute text-sm' };
      case 'elegant': return { label: 'font-elegant text-[10px] font-bold tracking-[0.15em]', val: 'font-elegant text-sm' };
      default: return { label: 'font-sans text-[9px] font-bold tracking-[0.2em]', val: 'font-mono text-[10px]' };
    }
  };

  const fonts = getFontClasses();
  
  // Determine the color for the number. If numberColor is set (not auto), use it.
  // Otherwise fall back to dark/light mode defaults.
  const currentValColor = numberColor !== 'auto' 
    ? numberColor 
    : (isDarkMode ? 'text-white' : 'text-zinc-900');

  return (
    <div className="w-full mb-3 last:mb-0">
      <div className="flex justify-between items-end mb-1">
        <span className={`${fonts.label} uppercase ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {label}
        </span>
        <div className={`${fonts.val} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          <span className={`font-bold ${currentValColor}`}>{current}</span>
          <span className={isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}> / {target}{unit}</span>
        </div>
      </div>
      
      {/* Segmented Bar Container */}
      <div className="flex gap-[2px] h-1.5 w-full">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledSegments;
          // Calculate opacity for a glowing trail effect if filled
          const opacity = isFilled ? 1 : 0.15;
          
          return (
            <div 
              key={i}
              className={`flex-1 rounded-[1px] transition-all duration-300 ${isFilled ? colorClass.replace('text-', 'bg-') : (isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300')}`}
              style={{ 
                opacity: isFilled ? 1 : undefined 
              }}
            />
          );
        })}
      </div>
    </div>
  );
};