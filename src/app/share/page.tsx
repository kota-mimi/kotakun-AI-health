'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DailyLogCard } from '@/components/share/DailyLogCard';
import { DailyLogData, ThemeColor, LayoutConfig } from '@/types/dailyLog';
import { RefreshCw, Download, Palette, Globe, Calendar, EyeOff, Eye, Moon, Sun, Image as ImageIcon, Move, Maximize2, X, ArrowLeft, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const BACKGROUNDS = [
  { name: 'Dark', class: 'bg-zinc-950', isDark: true },
  { name: 'Light', class: 'bg-white', isDark: false },
];

const THEMES: ThemeColor[] = ['text-emerald-500', 'text-cyan-500', 'text-blue-500', 'text-indigo-500', 'text-purple-500', 'text-pink-500'];

const INITIAL_LAYOUT: LayoutConfig = {
  x: 0, 
  y: 0
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
          date: new Date(parsed.date)
        };
        
        console.log('🔍 Share page - Final data:', processedData);
        return processedData;
      }
    } catch (error) {
      console.error('❌ Failed to parse data from URL:', error);
    }
    
    // デフォルトデータ
    console.warn('⚠️ Share page - Using default data (no URL params found)');
    return {
      date: new Date(),
      weight: { current: 0, diff: 0 },
      calories: { current: 0, target: 2000 },
      pfc: {
        p: { current: 0, target: 120 },
        f: { current: 0, target: 67 },
        c: { current: 0, target: 250 }
      },
      exercise: { minutes: 0, caloriesBurned: 0 }
    };
  });

  // カスタマイズ設定
  const [theme, setTheme] = useState<ThemeColor>('text-blue-500');
  const [bgIndex, setBgIndex] = useState(0);
  const [isJapanese, setIsJapanese] = useState(true);
  const [numericDate, setNumericDate] = useState(false);
  const [hideWeight, setHideWeight] = useState(false);
  
  // 高度なカスタマイズ
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [isEditing, setIsEditing] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(INITIAL_LAYOUT);
  const [globalScale, setGlobalScale] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartDist = useRef<number | null>(null);
  const startScale = useRef<number>(1);

  const handleThemeChange = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
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
    e.preventDefault();
    
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(2, Math.max(0.4, globalScale + delta));
    setGlobalScale(newScale);
  };

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
    e.preventDefault();
    
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

  // 画像生成とダウンロード
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // モバイルかデスクトップかでカード要素を選択
      const cardElement = document.getElementById('share-card') || document.getElementById('share-card-mobile');
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

  return (
    <div className="min-h-screen bg-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* 戻るボタン（モバイル） */}
        <button
          onClick={() => router.back()}
          className="md:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>戻る</span>
        </button>

        {/* デスクトップレイアウト */}
        <div className="hidden md:flex items-center justify-center p-8 gap-8">
          {/* カードプレビューエリア */}
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
               />
            </div>
            {isEditing && (
              <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow animate-pulse pointer-events-none z-50">
                ドラッグで移動 • ピンチ/ホイールでズーム
              </div>
            )}
          </div>

          {/* コントロールパネル（デスクトップ） */}
          <div className="flex flex-col max-w-sm w-full space-y-6 h-[640px] overflow-y-auto pr-2">
            
            {/* 戻るボタン（デスクトップ） */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors w-fit"
            >
              <ArrowLeft size={16} />
              <span>ダッシュボードに戻る</span>
            </button>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">記録を共有</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                カスタマイズして画像を生成・共有できます
              </p>
            </div>

            {/* 編集モード切り替え */}
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-bold transition-all ${isEditing ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {isEditing ? <CheckIcon /> : <Move size={18} />}
              {isEditing ? '編集完了' : 'レイアウト編集'}
            </button>

            {isEditing && (
               <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-4 animate-fadeIn">
                 
                 {/* ズームスライダー */}
                 <div className="space-y-2">
                   <div className="flex justify-between items-center text-xs font-bold uppercase text-zinc-500 tracking-wider">
                      <span className="flex items-center gap-2"><Maximize2 size={12}/> ズームレベル</span>
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
                     カード上でピンチまたはスクロールでも拡大縮小可能
                   </p>
                 </div>

                 <button 
                   onClick={() => {
                     setLayoutConfig(INITIAL_LAYOUT);
                     setGlobalScale(1);
                   }}
                   className="text-xs text-red-400 hover:text-red-300 w-full text-center mt-2 underline"
                 >
                   レイアウトとサイズをリセット
                 </button>
               </div>
            )}

            {/* 設定トグル */}
            <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => setIsJapanese(!isJapanese)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${isJapanese ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                >
                  <Globe size={14} />
                  {isJapanese ? "日本語" : "English"}
               </button>

               <button 
                  onClick={() => setNumericDate(!numericDate)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${numericDate ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                >
                  <Calendar size={14} />
                  {numericDate ? "12/12/2025" : "DEC 12"}
               </button>

               <button 
                  onClick={() => setHideWeight(!hideWeight)}
                  className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${hideWeight ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                >
                  {hideWeight ? <EyeOff size={14} /> : <Eye size={14} />}
                  {hideWeight ? "体重を隠す" : "体重を表示"}
               </button>
            </div>

            {/* 背景設定 */}
             <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2">背景設定</h3>
              
              <div className="flex gap-2">
                 <button 
                    onClick={handleBgChange}
                    disabled={!!customImage}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${!!customImage ? 'opacity-50 cursor-not-allowed border-zinc-800 text-zinc-600' : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'}`}
                  >
                    {currentBg.isDark ? <Moon size={14} /> : <Sun size={14} />}
                    <span>テーマ</span>
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
                        className={`w-full h-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${customImage ? 'bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50' : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'}`}
                     >
                        {customImage ? <X size={14} /> : <ImageIcon size={14} />}
                        <span>{customImage ? '削除' : 'アップロード'}</span>
                     </button>
                  </div>
              </div>

              {customImage && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>オーバーレイの濃さ</span>
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

            {/* メインアクションボタン */}
            <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 shadow-xl space-y-4">
              
              <button 
                onClick={handleThemeChange}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 transition-all duration-200"
              >
                <Palette size={18} className={theme.replace('text-', 'text-')} />
                <span className="font-mono text-sm">アクセントカラー変更</span>
              </button>

              <div className="h-px bg-zinc-800 my-2" />

              <button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-zinc-200 text-black rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Share2 size={18} />
                )}
                <span className="font-mono text-sm font-bold">
                  {isGenerating ? '生成中...' : '共有・保存'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* モバイルレイアウト */}
        <div className="md:hidden flex flex-col">
          {/* カードプレビューエリア（モバイル） */}
          <div className="p-4 pt-16 flex justify-center">
            <div 
              className="relative group touch-none"
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ transform: 'scale(0.8)' }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700 to-zinc-800 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                 <DailyLogCard 
                   data={data} 
                   theme={theme} 
                   id="share-card-mobile" 
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
                 />
              </div>
              {isEditing && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow animate-pulse pointer-events-none z-50">
                  ドラッグで移動 • ピンチ/ホイールでズーム
                </div>
              )}
            </div>
          </div>

          {/* コントロールパネル（モバイル） */}
          <div className="flex flex-col px-4 pb-4 space-y-4 max-h-[60vh] overflow-y-auto">
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">記録を共有</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                カスタマイズして画像を生成・共有できます
              </p>
            </div>

            {/* 編集モード切り替え */}
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-bold transition-all ${isEditing ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {isEditing ? <CheckIcon /> : <Move size={18} />}
              {isEditing ? '編集完了' : 'レイアウト編集'}
            </button>

            {isEditing && (
               <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-4">
                 
                 {/* ズームスライダー */}
                 <div className="space-y-2">
                   <div className="flex justify-between items-center text-xs font-bold uppercase text-zinc-500 tracking-wider">
                      <span className="flex items-center gap-2"><Maximize2 size={12}/> ズームレベル</span>
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
                 </div>

                 <button 
                   onClick={() => {
                     setLayoutConfig(INITIAL_LAYOUT);
                     setGlobalScale(1);
                   }}
                   className="text-xs text-red-400 hover:text-red-300 w-full text-center mt-2 underline"
                 >
                   レイアウトとサイズをリセット
                 </button>
               </div>
            )}

            {/* 設定トグル */}
            <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => setIsJapanese(!isJapanese)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${isJapanese ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                >
                  <Globe size={14} />
                  {isJapanese ? "日本語" : "English"}
               </button>

               <button 
                  onClick={() => setHideWeight(!hideWeight)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${hideWeight ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                >
                  {hideWeight ? <EyeOff size={14} /> : <Eye size={14} />}
                  {hideWeight ? "体重隠す" : "体重表示"}
               </button>
            </div>

            {/* アクションボタン */}
            <div className="space-y-3">
              <button 
                onClick={handleThemeChange}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 transition-all duration-200"
              >
                <Palette size={18} className={theme.replace('text-', 'text-')} />
                <span className="font-mono text-sm">色変更</span>
              </button>

              <button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-zinc-200 text-black rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Share2 size={18} />
                )}
                <span className="font-mono text-sm font-bold">
                  {isGenerating ? '生成中...' : '共有・保存'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

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