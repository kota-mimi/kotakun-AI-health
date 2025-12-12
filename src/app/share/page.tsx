'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DailyLogCard } from '@/components/share/DailyLogCard';
import { DailyLogData, ThemeColor, LayoutConfig, FontStyleId } from '@/types/dailyLog';
import { RefreshCw, Download, Palette, Globe, Calendar, EyeOff, Eye, Moon, Sun, Image as ImageIcon, Move, Maximize2, X, PenTool, Type, Gamepad2, Feather, BookOpen, Edit3, Heart, Sparkles, PaintBucket, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

const MOCK_DATA: DailyLogData = {
  date: new Date(),
  weight: {
    current: 72.4,
    diff: -0.4,
  },
  calories: {
    current: 1850,
    target: 2100,
  },
  pfc: {
    p: { current: 145, target: 160, unit: 'g' },
    f: { current: 48, target: 65, unit: 'g' },
    c: { current: 210, target: 240, unit: 'g' },
  },
  exercise: {
    minutes: 45,
    caloriesBurned: 320,
  },
  achievementRate: 88,
};

const BACKGROUNDS = [
  { name: 'Dark', class: 'bg-zinc-950', isDark: true },
  { name: 'Light', class: 'bg-white', isDark: false },
];

const FONTS: { id: FontStyleId; name: string; icon: React.ReactNode }[] = [
  { id: 'standard', name: 'Digital', icon: <Type size={14}/> },
  { id: 'sketch', name: 'Sketch', icon: <Edit3 size={14}/> },
  { id: 'marker', name: 'Marker', icon: <PenTool size={14}/> },
  { id: 'pen', name: 'Pen', icon: <Feather size={14}/> },
  { id: 'novel', name: 'Novel', icon: <BookOpen size={14}/> },
  { id: 'pixel', name: 'Pixel', icon: <Gamepad2 size={14}/> },
  { id: 'cute', name: 'Cute', icon: <Heart size={14}/> },
  { id: 'elegant', name: 'Elegant', icon: <Sparkles size={14}/> },
];

const NUMBER_COLORS = [
  { id: 'auto', value: 'auto', name: 'Auto', bg: 'bg-zinc-800' }, 
  { id: 'white', value: 'text-white', name: 'White', bg: 'bg-white' },
  { id: 'gray', value: 'text-zinc-400', name: 'Gray', bg: 'bg-zinc-400' },
  { id: 'red', value: 'text-red-500', name: 'Red', bg: 'bg-red-500' },
  { id: 'orange', value: 'text-orange-500', name: 'Orange', bg: 'bg-orange-500' },
  { id: 'yellow', value: 'text-yellow-400', name: 'Yellow', bg: 'bg-yellow-400' },
  { id: 'lime', value: 'text-lime-400', name: 'Lime', bg: 'bg-lime-400' },
  { id: 'green', value: 'text-emerald-500', name: 'Green', bg: 'bg-emerald-500' },
  { id: 'cyan', value: 'text-cyan-400', name: 'Cyan', bg: 'bg-cyan-400' },
  { id: 'blue', value: 'text-blue-500', name: 'Blue', bg: 'bg-blue-500' },
  { id: 'purple', value: 'text-violet-500', name: 'Purple', bg: 'bg-violet-500' },
  { id: 'pink', value: 'text-pink-500', name: 'Pink', bg: 'bg-pink-500' },
];

const INITIAL_LAYOUT: LayoutConfig = {
  x: 0, 
  y: 0
};

const UI_TEXT = {
  en: {
    title: 'Daily Summary',
    subtitle: 'Customize your daily report style.',
    fontStyle: 'Font Style',
    numberColor: 'Number Color',
    finishEditing: 'Finish Layout Editing',
    adjustLayout: 'Adjust Layout & Zoom',
    zoomLevel: 'Zoom Level',
    zoomHint: 'Pinch or scroll on the card to zoom all content',
    resetLayout: 'Reset Layout',
    background: 'Background',
    theme: 'Theme',
    upload: 'Upload',
    remove: 'Remove',
    overlayDarkness: 'Overlay Darkness',
    simulate: 'Simulate New Day',
    accentColor: 'Accent Color',
    shareSave: 'Share / Save',
    dragHint: 'Drag to Move • Pinch/Wheel to Zoom'
  },
  ja: {
    title: '1日の記録',
    subtitle: '日報のデザインをカスタマイズできます。',
    fontStyle: 'フォントスタイル',
    numberColor: '数字のカラー',
    finishEditing: '編集を完了',
    adjustLayout: 'レイアウト・拡大率の調整',
    zoomLevel: '拡大レベル',
    zoomHint: 'カード上のスクロール操作などで拡大できます',
    resetLayout: '配置をリセット',
    background: '背景設定',
    theme: 'テーマ',
    upload: '画像追加',
    remove: '削除',
    overlayDarkness: '画像の暗さ',
    simulate: 'データ更新 (テスト用)',
    accentColor: 'アクセント色',
    shareSave: '保存 / 共有',
    dragHint: 'ドラッグで移動 • ホイールで拡大'
  }
};

function SharePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URLパラメータから記録データを取得
  const [data, setData] = useState<DailyLogData>(() => {
    try {
      const dataParam = searchParams.get('data');
      console.log('🔍 Share page - URL param received:', dataParam ? 'YES' : 'NO');
      
      if (dataParam) {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        console.log('🔍 Share page - Parsed data:', parsed);
        
        const processedData = {
          ...parsed,
          date: new Date(parsed.date),
          pfc: {
            p: { current: parsed.pfc.p.current, target: parsed.pfc.p.target, unit: 'g' },
            f: { current: parsed.pfc.f.current, target: parsed.pfc.f.target, unit: 'g' },
            c: { current: parsed.pfc.c.current, target: parsed.pfc.c.target, unit: 'g' }
          },
          achievementRate: parsed.achievementRate || 88
        };
        
        console.log('🔍 Share page - Final data:', processedData);
        return processedData;
      }
    } catch (error) {
      console.error('❌ Failed to parse data from URL:', error);
    }
    
    // デフォルトデータ
    console.warn('⚠️ Share page - Using default data (no URL params found)');
    return MOCK_DATA;
  });

  const [theme, setTheme] = useState<ThemeColor>(ThemeColor.EMERALD);
  const [bgIndex, setBgIndex] = useState(0);
  const [isJapanese, setIsJapanese] = useState(true);
  const [numericDate, setNumericDate] = useState(false);
  const [hideWeight, setHideWeight] = useState(false);
  const [fontStyle, setFontStyle] = useState<FontStyleId>('standard');
  const [numberColor, setNumberColor] = useState<string>('auto');
  
  // Customization State
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [isEditing, setIsEditing] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(INITIAL_LAYOUT);
  const [globalScale, setGlobalScale] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Touch state for pinch zoom
  const touchStartDist = useRef<number | null>(null);
  const startScale = useRef<number>(1);

  // Simulate AI data generation
  const handleRegenerate = () => {
    const randomDiff = (Math.random() * 2 - 1).toFixed(1);
    const newWeight = (72 + Math.random()).toFixed(1);
    
    setData({
      ...data,
      date: new Date(),
      weight: {
        current: parseFloat(newWeight),
        diff: parseFloat(randomDiff),
      },
      calories: {
        current: Math.floor(1600 + Math.random() * 600),
        target: 2200,
      },
      achievementRate: Math.floor(60 + Math.random() * 40),
    });
  };

  const handleThemeChange = () => {
    if (theme === ThemeColor.EMERALD) setTheme(ThemeColor.CYAN);
    else if (theme === ThemeColor.CYAN) setTheme(ThemeColor.INDIGO);
    else setTheme(ThemeColor.EMERALD);
  };

  const handleBgChange = () => {
    setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLayoutChange = (x: number, y: number) => {
    setLayoutConfig({ x, y });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isEditing) return;
    
    // Zoom in/out based on wheel delta
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(2, Math.max(0.4, globalScale + delta));
    setGlobalScale(newScale);
  };

  // Pinch Zoom Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditing || e.touches.length !== 2) return;
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    touchStartDist.current = dist;
    startScale.current = globalScale;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEditing || e.touches.length !== 2 || touchStartDist.current === null) return;
    e.preventDefault(); // Prevent page scroll
    
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    
    const scaleFactor = dist / touchStartDist.current;
    const newScale = Math.min(2, Math.max(0.4, startScale.current * scaleFactor));
    setGlobalScale(newScale);
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
  };

  // 画像生成とダウンロード/共有
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const cardElement = document.getElementById('share-card');
      if (!cardElement) throw new Error('Card element not found');

      const canvas = await html2canvas(cardElement, {
        width: 375,
        height: 640,
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate blob'));
        }, 'image/png', 0.95);
      });

      // Web Share API または ダウンロード
      const fileName = `healthy-record-${data.date.toLocaleDateString('ja-JP')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `ヘルシーくん記録 - ${data.date.toLocaleDateString('ja-JP')}`,
          text: `${data.date.toLocaleDateString('ja-JP')}の記録\n🔥 ${data.calories.current}kcal\n💪 ${data.exercise.minutes}分運動`
        });
      } else {
        // フォールバック: ダウンロード
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }

    } catch (error) {
      console.error('Share/Download failed:', error);
      alert('共有に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentBg = BACKGROUNDS[bgIndex];
  const ui = isJapanese ? UI_TEXT.ja : UI_TEXT.en;

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 md:p-8 font-sans touch-none md:touch-auto">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        
        {/* The Card Component Area */}
        <div 
          className="relative group touch-none"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700 to-zinc-800 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
             <DailyLogCard 
               data={data} 
               theme={theme} 
               id="share-card" 
               isJapanese={isJapanese}
               numericDate={numericDate}
               hideWeight={hideWeight}
               bgClass={currentBg.class}
               isDarkMode={currentBg.isDark}
               customImage={customImage}
               overlayOpacity={overlayOpacity}
               layoutConfig={layoutConfig}
               onLayoutChange={handleLayoutChange}
               isEditing={isEditing}
               globalScale={globalScale}
               fontStyle={fontStyle}
               numberColor={numberColor}
             />
          </div>
          {isEditing && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow animate-pulse pointer-events-none z-50">
              {ui.dragHint}
            </div>
          )}
        </div>

        {/* Controls / Context Area */}
        <div className="flex flex-col max-w-sm w-full space-y-5 h-[640px] overflow-y-auto pr-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">{ui.title}</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {ui.subtitle}
            </p>
          </div>

          {/* Font Selector */}
          <div className="space-y-2">
             <h3 className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider px-1">{ui.fontStyle}</h3>
             <div className="grid grid-cols-4 gap-2">
                {FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => setFontStyle(font.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${fontStyle === font.id ? 'bg-zinc-100 border-white text-black shadow-lg scale-105 ring-2 ring-blue-500/50' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                  >
                    <div className="mb-1.5">{font.icon}</div>
                    <span className="text-[9px] font-bold tracking-wide truncate w-full text-center">{font.name}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* Number Color Selector (NEW) */}
          <div className="space-y-2">
             <h3 className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider px-1 flex items-center gap-2">
               <PaintBucket size={12} /> {ui.numberColor}
             </h3>
             <div className="flex flex-wrap gap-2">
                {NUMBER_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setNumberColor(color.value)}
                    title={color.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center
                      ${numberColor === color.value ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-zinc-800 hover:border-zinc-500'}
                      ${color.bg}
                    `}
                  >
                    {color.id === 'auto' && <span className="text-[8px] text-zinc-400 font-bold">A</span>}
                  </button>
                ))}
             </div>
          </div>

          {/* Edit Mode Toggle */}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-bold text-sm transition-all ${isEditing ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
          >
            {isEditing ? <Check size={16} /> : <Move size={16} />}
            {isEditing ? ui.finishEditing : ui.adjustLayout}
          </button>

          {isEditing && (
             <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-3 animate-fadeIn">
               
               {/* Global Scale Slider */}
               <div className="space-y-2">
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                    <span className="flex items-center gap-2"><Maximize2 size={12}/> {ui.zoomLevel}</span>
                    <span className="text-zinc-300">{Math.round(globalScale * 100)}%</span>
                 </div>
                 <input 
                    type="range" 
                    min="0.4" 
                    max="2.0" 
                    step="0.05"
                    value={globalScale}
                    onChange={(e) => setGlobalScale(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                 />
                 <p className="text-[10px] text-zinc-500 text-center">
                   {ui.zoomHint}
                 </p>
               </div>
               
               <button 
                 onClick={() => {
                   setLayoutConfig(INITIAL_LAYOUT);
                   setGlobalScale(1);
                 }}
                 className="text-[10px] text-red-400 hover:text-red-300 w-full text-center underline"
               >
                 {ui.resetLayout}
               </button>
             </div>
          )}

          {/* Settings Toggles */}
          <div className="grid grid-cols-2 gap-2">
             <button 
                onClick={() => setIsJapanese(!isJapanese)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${isJapanese ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
              >
                <Globe size={12} />
                {isJapanese ? "日本語" : "English"}
             </button>

             <button 
                onClick={() => setNumericDate(!numericDate)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${numericDate ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
              >
                <Calendar size={12} />
                {numericDate ? "11/12" : "NOV 12"}
             </button>

             <button 
                onClick={() => setHideWeight(!hideWeight)}
                className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${hideWeight ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
              >
                {hideWeight ? <EyeOff size={12} /> : <Eye size={12} />}
                {hideWeight ? "Hidden" : "Weight"}
             </button>
          </div>

          {/* Background Controls */}
           <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-xl space-y-3">
            <h3 className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">{ui.background}</h3>
            
            <div className="flex gap-2">
               <button 
                  onClick={handleBgChange}
                  disabled={!!customImage}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${!!customImage ? 'opacity-50 cursor-not-allowed border-zinc-800 text-zinc-600' : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'}`}
                >
                  {currentBg.isDark ? <Moon size={12} /> : <Sun size={12} />}
                  <span>{ui.theme}</span>
                </button>
                <div className="relative flex-1">
                   <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                   />
                   <button 
                      onClick={() => customImage ? setCustomImage(null) : fileInputRef.current?.click()}
                      className={`w-full h-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${customImage ? 'bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50' : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'}`}
                   >
                      {customImage ? <X size={12} /> : <ImageIcon size={12} />}
                      <span>{customImage ? ui.remove : ui.upload}</span>
                   </button>
                </div>
            </div>

            {customImage && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>{ui.overlayDarkness}</span>
                  <span>{Math.round(overlayOpacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="0.95" 
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
           </div>

          {/* Main Action Buttons */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-xl space-y-3">
            <button 
              onClick={handleRegenerate}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 transition-all duration-200 group"
            >
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-mono text-xs">{ui.simulate}</span>
            </button>

            <button 
              onClick={handleThemeChange}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 transition-all duration-200"
            >
              <Palette size={16} className={theme.split(' ')[0]} />
              <span className="font-mono text-xs">{ui.accentColor}</span>
            </button>

            <div className="h-px bg-zinc-800 my-1" />

             <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="font-mono text-xs font-bold">
                {isGenerating ? '生成中...' : ui.shareSave}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white text-lg">読み込み中...</div>
      </div>
    }>
      <SharePageContent />
    </Suspense>
  );
}