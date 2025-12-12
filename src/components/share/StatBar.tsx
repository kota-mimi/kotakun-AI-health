import React from 'react';

interface StatBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  colorClass: string; // Tailwind text color class
  isDarkMode?: boolean;
}

export const StatBar: React.FC<StatBarProps> = ({ 
  label, 
  current, 
  target, 
  unit, 
  colorClass,
  isDarkMode = true
}) => {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  
  // Create segments for the digital gauge look
  const totalSegments = 24;
  const filledSegments = Math.round((percentage / 100) * totalSegments);
  
  return (
    <div className="w-full mb-3 last:mb-0">
      <div className="flex justify-between items-end mb-1">
        <span className={`text-[9px] tracking-[0.2em] font-bold uppercase font-sans ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {label}
        </span>
        <div className={`font-mono text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{current}</span>
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