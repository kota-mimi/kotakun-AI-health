import React, { useRef } from 'react';
import { DailyLogData, ThemeColor, LayoutConfig, FontStyleId } from '@/types/dailyLog';
import { StatBar } from './StatBar';
import { TrendingDown, TrendingUp, Minus, Lock } from 'lucide-react';
import Draggable from 'react-draggable';

interface DailyLogCardProps {
  data: DailyLogData;
  theme: ThemeColor;
  id?: string;
  isJapanese?: boolean;
  numericDate?: boolean;
  hideWeight?: boolean;
  bgClass?: string;
  isDarkMode?: boolean;
  customImage?: string | null;
  overlayOpacity?: number;
  layoutConfig?: LayoutConfig;
  onLayoutChange?: (x: number, y: number) => void;
  isEditing?: boolean;
  globalScale?: number;
  fontStyle?: FontStyleId;
  numberColor?: string;
}

const TEXT = {
  en: {
    date: 'Date',
    status: 'Status',
    logged: 'Logged',
    weight: 'Weight',
    intake: 'Intake',
    macroTitle: 'Macro Balance',
    protein: 'Protein',
    fat: 'Fat',
    carbs: 'Carbs',
    minutes: 'Minutes',
    burned: 'Burned',
    hidden: 'Food details hidden',
    powered: 'POWERED BY AI'
  },
  ja: {
    date: '日付',
    status: '状況',
    logged: '記録済',
    weight: '体重',
    intake: '摂取カロリー',
    macroTitle: 'PFCバランス',
    protein: 'タンパク質 (P)',
    fat: '脂質 (F)',
    carbs: '炭水化物 (C)',
    minutes: '運動時間',
    burned: '消費カロリー',
    hidden: '食事内容は非表示',
    powered: 'AIによる解析'
  }
};

export const DailyLogCard: React.FC<DailyLogCardProps> = ({ 
  data, 
  theme, 
  id,
  isJapanese = false,
  numericDate = false,
  hideWeight = false,
  bgClass = 'bg-zinc-950',
  isDarkMode = true,
  customImage = null,
  overlayOpacity = 0.5,
  layoutConfig = { x: 0, y: 0 },
  onLayoutChange,
  isEditing = false,
  globalScale = 1,
  fontStyle = 'standard',
  numberColor = 'auto'
}) => {
  const t = isJapanese ? TEXT.ja : TEXT.en;
  const contentRef = useRef<HTMLDivElement>(null);

  // Font class switching
  const getFontClasses = () => {
    switch (fontStyle) {
      case 'sketch': 
        return { label: 'font-hand font-bold tracking-[0.1em]', val: 'font-hand' };
      case 'marker': 
        return { label: 'font-marker font-bold tracking-[0.05em]', val: 'font-marker' };
      case 'pen': 
        return { label: 'font-pen font-bold tracking-[0.05em]', val: 'font-pen' };
      case 'novel': 
        return { label: 'font-serif font-bold tracking-[0.2em]', val: 'font-serif' };
      case 'pixel': 
        return { label: 'font-pixel tracking-[0.1em]', val: 'font-pixel' };
      case 'cute': 
        return { label: 'font-cute tracking-[0.05em]', val: 'font-cute' };
      case 'elegant': 
        return { label: 'font-elegant font-bold tracking-[0.15em]', val: 'font-elegant' };
      case 'standard':
      default: 
        return { label: 'font-sans font-bold tracking-[0.2em]', val: 'font-mono' };
    }
  };
  
  const fonts = getFontClasses();

  // Define styles based on mode (if no custom image)
  const effectiveIsDarkMode = customImage ? true : isDarkMode;
  
  const styles = effectiveIsDarkMode ? {
    textPrimary: 'text-white',
    textSecondary: 'text-white/50',
    textTertiary: 'text-white/20',
    textMuted: 'text-white/40',
    border: 'border-white/10',
    panelBg: 'bg-white/5',
    iconBg: 'bg-white/5',
    footer: 'text-white/60'
  } : {
    textPrimary: 'text-zinc-900',
    textSecondary: 'text-zinc-500',
    textTertiary: 'text-zinc-300',
    textMuted: 'text-zinc-400',
    border: 'border-zinc-200',
    panelBg: 'bg-zinc-50',
    iconBg: 'bg-zinc-100',
    footer: 'text-zinc-400'
  };

  const formatDate = (date: Date) => {
    if (numericDate) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const getWeightDiffIcon = (diff: number) => {
    if (diff < 0) return <TrendingDown size={14} />;
    if (diff > 0) return <TrendingUp size={14} />;
    return <Minus size={14} />;
  };

  const diffColor = data.weight.diff < 0 ? 'text-emerald-400' : (data.weight.diff > 0 ? 'text-rose-400' : styles.textSecondary);

  // Helper to determine text color for numbers
  const numColorClass = numberColor !== 'auto' ? numberColor : styles.textPrimary;

  return (
    <div 
      id={id}
      className={`w-[375px] h-[640px] ${!customImage ? bgClass : 'bg-black'} relative overflow-hidden flex flex-col select-none shadow-2xl transition-colors duration-500`}
      style={{
        boxShadow: '0 0 50px -12px rgba(0,0,0,0.5)'
      }}
    >
      {/* Background Layer (Static) */}
      {customImage ? (
        <>
          <img src={customImage} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0" />
          <div 
            className="absolute inset-0 bg-black z-1 pointer-events-none transition-opacity duration-300"
            style={{ opacity: overlayOpacity }}
          />
        </>
      ) : (
        <>
          <div className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] ${isDarkMode ? 'from-zinc-800/20' : 'from-zinc-200/40'} via-transparent to-transparent z-0 pointer-events-none`} />
          <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 blur-[100px] rounded-full pointer-events-none bg-emerald-500`} />
        </>
      )}

      {/* Draggable & Scalable Content Layer (Entire Block) */}
      <Draggable
        nodeRef={contentRef}
        position={{ x: layoutConfig.x, y: layoutConfig.y }}
        onStop={(_e, data) => onLayoutChange && onLayoutChange(data.x, data.y)}
        disabled={!isEditing}
        scale={globalScale}
      >
        <div 
          ref={contentRef}
          className={`absolute top-0 left-0 w-full h-full p-6 origin-center transition-transform duration-75 ease-out ${isEditing ? 'cursor-move ring-1 ring-white/20' : ''}`}
          style={{
             transform: `scale(${globalScale})`
          }}
        >
          {/* Inner Flex Container */}
          <div className="flex flex-col h-full pointer-events-none">
            
            {/* Header */}
            <header className={`flex justify-between items-start mb-8 border-b ${styles.border} pb-4`}>
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase mb-1 ${fonts.label} ${styles.textSecondary}`}>{t.date}</span>
                <h1 className={`text-3xl ${fonts.val} font-bold tracking-tight ${numColorClass}`}>{formatDate(data.date)}</h1>
              </div>
            </header>

            {/* Hero Metrics (Weight & Calories) */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {/* Weight */}
              <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase ${fonts.label} ${styles.textSecondary}`}>{t.weight}</span>
                  </div>
                  
                  {hideWeight ? (
                    <div className="flex items-baseline gap-1">
                      <div className={`text-6xl ${fonts.val} font-bold tracking-tighter flex items-center h-[60px] ${styles.textTertiary}`}>
                        <span className="text-4xl">●●●</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-6xl ${fonts.val} font-bold tracking-tighter ${numColorClass}`}>{data.weight.current}</span>
                      <span className={`text-sm font-bold ${fonts.val} ${effectiveIsDarkMode ? 'text-white/60' : 'text-zinc-500'}`}>KG</span>
                    </div>
                  )}
                  
                  {hideWeight ? (
                    <div className={`flex items-center gap-1 mt-1 text-xs ${fonts.val} ${styles.textMuted}`}>
                      <Lock size={12} />
                      <span>PRIVATE</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1 mt-1 text-sm ${fonts.val} ${diffColor}`}>
                      {getWeightDiffIcon(data.weight.diff)}
                      <span>{Math.abs(data.weight.diff)} kg</span>
                    </div>
                  )}
                </div>

              {/* Calories */}
              <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase ${fonts.label} ${styles.textSecondary}`}>{t.intake}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-6xl ${fonts.val} font-bold tracking-tighter ${numColorClass}`}>{data.calories.current}</span>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 text-sm ${fonts.val} ${styles.textSecondary}`}>
                    <span>/ {data.calories.target} KCAL</span>
                  </div>
                </div>
            </div>

            {/* PFC Visualizer */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <span className={`text-[10px] uppercase ${fonts.label} ${styles.textMuted}`}>{t.macroTitle}</span>
                </div>
                <div className="mt-2">
                  <StatBar 
                    label={t.protein}
                    current={data.pfc.p.current} 
                    target={data.pfc.p.target} 
                    unit="g" 
                    colorClass="text-red-500" 
                    isDarkMode={effectiveIsDarkMode}
                    fontStyle={fontStyle}
                    numberColor={numberColor}
                  />
                  <div className="h-4" />
                  <StatBar 
                    label={t.fat} 
                    current={data.pfc.f.current} 
                    target={data.pfc.f.target} 
                    unit="g" 
                    colorClass="text-yellow-400" 
                    isDarkMode={effectiveIsDarkMode}
                    fontStyle={fontStyle}
                    numberColor={numberColor}
                  />
                  <div className="h-4" />
                  <StatBar 
                    label={t.carbs} 
                    current={data.pfc.c.current} 
                    target={data.pfc.c.target} 
                    unit="g" 
                    colorClass="text-green-500" 
                    isDarkMode={effectiveIsDarkMode}
                    fontStyle={fontStyle}
                    numberColor={numberColor}
                  />
                </div>
              </div>

            {/* Bottom Section: Exercise Only */}
            <div>
                <div className="flex items-start pt-2">
                  {/* Time */}
                  <div className="flex-1 flex flex-col pr-6 border-r border-dashed border-zinc-700/50">
                      <div className={`text-[10px] tracking-wider uppercase mb-1 ${fonts.label} ${styles.textSecondary}`}>{t.minutes}</div>
                      <div className={`text-5xl ${fonts.val} font-bold leading-none ${numColorClass}`}>{data.exercise.minutes}</div>
                  </div>

                  {/* Burned */}
                  <div className="flex-1 flex flex-col pl-8">
                      <div className={`text-[10px] tracking-wider uppercase mb-1 ${fonts.label} ${styles.textSecondary}`}>{t.burned}</div>
                      <div className={`text-5xl ${fonts.val} font-bold leading-none ${numColorClass}`}>{data.exercise.caloriesBurned}</div>
                  </div>
                </div>
              </div>

            {/* Footer */}
            <footer className={`mt-auto pt-4 border-t ${styles.border} flex justify-between items-center opacity-50`}>
              <div className={`text-[9px] uppercase tracking-widest flex items-center gap-1.5 ${styles.footer}`}>
                <div className={`w-1 h-1 rounded-full ${effectiveIsDarkMode ? 'bg-white/60' : 'bg-zinc-400'}`} />
                {t.hidden}
              </div>
              <div className={`text-[9px] ${fonts.val} flex items-center gap-1.5 ${styles.footer}`}>
                {t.powered}
              </div>
            </footer>
          </div>
        </div>
      </Draggable>
    </div>
  );
};