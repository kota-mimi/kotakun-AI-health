'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  ArrowLeft,
  Check,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface BackgroundSettingsPageProps {
  onBack: () => void;
}

const SOLID_COLORS = [
  { id: 'white', name: '白', color: '#ffffff' },
  { id: 'light-gray', name: 'ライトグレー', color: '#f3f4f6' },
  { id: 'blue', name: 'ブルー', color: '#3b82f6' },
  { id: 'green', name: 'グリーン', color: '#10b981' },
  { id: 'purple', name: 'パープル', color: '#8b5cf6' },
  { id: 'pink', name: 'ピンク', color: '#ec4899' },
  { id: 'red', name: 'レッド', color: '#ef4444' },
  { id: 'orange', name: 'オレンジ', color: '#f97316' },
];

const GRADIENT_COLORS = [
  { id: 'gradient-ocean', name: 'オーシャン', url: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', isGradient: true },
  { id: 'gradient-sunset', name: 'サンセット', url: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', isGradient: true },
  { id: 'gradient-nature', name: 'ネイチャー', url: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', isGradient: true },
  { id: 'gradient-warm', name: 'ウォーム', url: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', isGradient: true },
  { id: 'gradient-cool', name: 'クール', url: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', isGradient: true },
  { id: 'gradient-dark', name: 'ダーク', url: 'linear-gradient(135deg, #2c3e50 0%, #4a6741 100%)', isGradient: true },
  { id: 'gradient-purple', name: 'パープル', url: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', isGradient: true },
  { id: 'gradient-pink', name: 'ピンク', url: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', isGradient: true },
];

export function BackgroundSettingsPage({ onBack }: BackgroundSettingsPageProps) {
  const [selectedBackground, setSelectedBackground] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient' | 'custom'>('solid');
  const [isLoading, setIsLoading] = useState(true);
  const [customColor, setCustomColor] = useState<string>('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { liffUser } = useAuth();

  // Firebase から背景設定を読み込み
  useEffect(() => {
    loadBackgroundSettings();
  }, [liffUser]);

  const loadBackgroundSettings = async () => {
    try {
      if (!liffUser?.userId) {
        // LIFF未認証時はlocalStorageから読み込み
        const savedBackground = localStorage.getItem('app-background') || 'white';
        setSelectedBackground(savedBackground);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/background/settings?userId=${liffUser.userId}`);
      if (response.ok) {
        const { backgroundSettings } = await response.json();
        setSelectedBackground(backgroundSettings.type);
        
        // localStorageも同期
        localStorage.setItem('app-background', backgroundSettings.type);
        
        // 背景を即座に適用
        applyBackground(backgroundSettings.type);
      }
    } catch (error) {
      console.error('Failed to load background settings:', error);
      // エラー時はlocalStorageにフォールバック
      const savedBackground = localStorage.getItem('app-background') || 'white';
      setSelectedBackground(savedBackground);
    } finally {
      setIsLoading(false);
    }
  };

  // 背景を保存
  const saveBackground = async (backgroundId: string, customColorValue?: string) => {
    try {
      // ローカルに即座に適用
      if (customColorValue) {
        localStorage.setItem('app-background', 'custom');
        localStorage.setItem('app-background-custom-color', customColorValue);
        setSelectedBackground('custom');
        setCustomColor(customColorValue);
      } else {
        localStorage.setItem('app-background', backgroundId);
        localStorage.removeItem('app-background-custom-color');
        setSelectedBackground(backgroundId);
      }
      
      // 背景をすぐに適用
      applyBackground(backgroundId, customColorValue);

      // Firebase に保存
      if (liffUser?.userId) {
        await fetch('/api/background/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: liffUser.userId,
            backgroundType: customColorValue ? 'custom' : backgroundId,
            customColor: customColorValue || null
          })
        });
      }
    } catch (error) {
      console.error('Failed to save background settings:', error);
    }
  };

  // 背景を適用
  const applyBackground = (backgroundId: string, customColorValue?: string) => {
    // 既存のスタイルをクリア
    const existingStyle = document.getElementById('app-background-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 新しいスタイルシートを作成
    const style = document.createElement('style');
    style.id = 'app-background-style';
    
    let backgroundCSS = '';
    
    if (backgroundId === 'custom' && customColorValue) {
      backgroundCSS = `
        body {
          background: ${customColorValue} !important;
          min-height: 100vh !important;
        }
        .min-h-screen {
          background: transparent !important;
        }
      `;
    } else {
      const preset = [...SOLID_COLORS, ...GRADIENT_COLORS].find(bg => bg.id === backgroundId);
      if (preset) {
        if (preset.isGradient) {
          backgroundCSS = `
            body {
              background: ${preset.url} !important;
              min-height: 100vh !important;
            }
            .min-h-screen {
              background: transparent !important;
            }
          `;
        } else if (preset.color) {
          backgroundCSS = `
            body {
              background: ${preset.color} !important;
              min-height: 100vh !important;
            }
            .min-h-screen {
              background: transparent !important;
            }
          `;
        }
      }
    }
    
    style.textContent = backgroundCSS;
    document.head.appendChild(style);
  };

  // デフォルトに戻す
  const resetToDefault = async () => {
    await saveBackground('white');
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl"></div>
        <div className="h-40 bg-gray-200 rounded-xl"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <Card className="backdrop-blur-xl bg-white/90 shadow-lg border border-white/40 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-white/60"
          >
            <ArrowLeft size={20} style={{color: '#FF6B6B'}} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">背景設定</h1>
            <p className="text-sm text-slate-600">アプリの背景画像をカスタマイズ</p>
          </div>
        </div>
      </Card>

      {/* タブ式カラーパレット */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">背景色</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            className="text-slate-600 hover:text-slate-800"
          >
            <RefreshCw size={16} className="mr-1" />
            白に戻す
          </Button>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex mb-4 bg-slate-100 rounded-lg p-1">
          <button
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'solid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('solid')}
          >
            単色
          </button>
          <button
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'gradient'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('gradient')}
          >
            グラデーション
          </button>
          <button
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'custom'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('custom')}
          >
            カスタム
          </button>
        </div>

        {/* カラーグリッドまたはカスタムカラーピッカー */}
        {activeTab === 'custom' ? (
          <div className="space-y-4">
            {/* カラープレビュー */}
            <div className="flex items-center space-x-3">
              <div 
                className="w-16 h-16 rounded-xl border-2 border-slate-200" 
                style={{ backgroundColor: customColor }}
              />
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  カラーコード
                </label>
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* HTML5カラーピッカー */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                カラーピッカー
              </label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-full h-12 rounded-lg border border-slate-300 cursor-pointer"
              />
            </div>

            {/* 適用ボタン */}
            <Button
              onClick={() => saveBackground('custom', customColor)}
              className="w-full"
            >
              この色を適用
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {(activeTab === 'solid' ? SOLID_COLORS : GRADIENT_COLORS).map((color) => (
              <button
                key={color.id}
                className={`aspect-square rounded-lg border-2 transition-all flex items-center justify-center relative overflow-hidden ${
                  selectedBackground === color.id 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={{
                  background: color.isGradient ? color.url : color.color,
                  boxShadow: color.id === 'white' ? 'inset 0 0 0 1px #e5e7eb' : 'none'
                }}
                onClick={() => saveBackground(color.id)}
              >
                {selectedBackground === color.id && (
                  <div className={`absolute inset-0 flex items-center justify-center ${color.isGradient ? 'bg-black/20' : ''}`}>
                    <Check size={16} className={color.id === 'white' ? 'text-gray-600' : 'text-white drop-shadow-sm'} />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 px-1 text-center font-medium">
                  {color.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>


    </div>
  );
}