'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  ArrowLeft,
  Upload,
  X,
  Check,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';

interface BackgroundSettingsPageProps {
  onBack: () => void;
}

const BASIC_COLORS = [
  { id: 'white', name: '白', color: '#ffffff' },
  { id: 'light-gray', name: 'ライトグレー', color: '#f3f4f6' },
  { id: 'blue', name: 'ブルー', color: '#3b82f6' },
  { id: 'green', name: 'グリーン', color: '#10b981' },
  { id: 'purple', name: 'パープル', color: '#8b5cf6' },
  { id: 'pink', name: 'ピンク', color: '#ec4899' },
];

const EXTENDED_COLORS = [
  // グラデーション
  { id: 'gradient-ocean', name: 'オーシャン', url: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', isGradient: true },
  { id: 'gradient-sunset', name: 'サンセット', url: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', isGradient: true },
  { id: 'gradient-nature', name: 'ネイチャー', url: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', isGradient: true },
  { id: 'gradient-warm', name: 'ウォーム', url: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', isGradient: true },
  { id: 'gradient-cool', name: 'クール', url: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', isGradient: true },
  { id: 'gradient-dark', name: 'ダーク', url: 'linear-gradient(135deg, #2c3e50 0%, #4a6741 100%)', isGradient: true },
  
  // 単色
  { id: 'navy', name: 'ネイビー', color: '#1e293b' },
  { id: 'emerald', name: 'エメラルド', color: '#059669' },
  { id: 'amber', name: 'アンバー', color: '#f59e0b' },
  { id: 'red', name: 'レッド', color: '#ef4444' },
  { id: 'indigo', name: 'インディゴ', color: '#6366f1' },
  { id: 'teal', name: 'ティール', color: '#14b8a6' },
  { id: 'rose', name: 'ローズ', color: '#f43f5e' },
  { id: 'cyan', name: 'シアン', color: '#06b6d4' },
  { id: 'lime', name: 'ライム', color: '#84cc16' },
  { id: 'orange', name: 'オレンジ', color: '#f97316' },
  { id: 'violet', name: 'バイオレット', color: '#7c3aed' },
  { id: 'slate', name: 'スレート', color: '#475569' },
];

export function BackgroundSettingsPage({ onBack }: BackgroundSettingsPageProps) {
  const [selectedBackground, setSelectedBackground] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showExtendedColors, setShowExtendedColors] = useState(false);

  // 現在の背景設定を読み込み
  useEffect(() => {
    const savedBackground = localStorage.getItem('app-background') || 'white';
    setSelectedBackground(savedBackground);
  }, []);

  // 背景を保存
  const saveBackground = (backgroundId: string, customUrl?: string) => {
    if (customUrl) {
      localStorage.setItem('app-background', 'custom');
      localStorage.setItem('app-background-custom-url', customUrl);
    } else {
      localStorage.setItem('app-background', backgroundId);
      localStorage.removeItem('app-background-custom-url');
    }
    setSelectedBackground(backgroundId);
    
    // 背景をすぐに適用
    applyBackground(backgroundId, customUrl);
  };

  // 背景を適用
  const applyBackground = (backgroundId: string, customUrl?: string) => {
    // 既存のスタイルをクリア
    const existingStyle = document.getElementById('app-background-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 新しいスタイルシートを作成
    const style = document.createElement('style');
    style.id = 'app-background-style';
    
    let backgroundCSS = '';
    
    if (backgroundId === 'custom' && customUrl) {
      backgroundCSS = `
        body {
          background-image: url(${customUrl}) !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          background-repeat: no-repeat !important;
          min-height: 100vh !important;
        }
        .min-h-screen {
          background: transparent !important;
        }
      `;
    } else {
      const preset = [...BASIC_COLORS, ...EXTENDED_COLORS].find(bg => bg.id === backgroundId);
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
        } else {
          backgroundCSS = `
            body {
              background-image: url(${preset.url}) !important;
              background-size: cover !important;
              background-position: center !important;
              background-attachment: fixed !important;
              background-repeat: no-repeat !important;
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

  // カスタム画像アップロード
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCustomImageUrl(result);
      saveBackground('custom', result);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // デフォルトに戻す
  const resetToDefault = () => {
    saveBackground('white');
    setCustomImageUrl('');
    localStorage.removeItem('app-background-custom-url');
  };

  const getCurrentBackground = () => {
    if (selectedBackground === 'custom') {
      return localStorage.getItem('app-background-custom-url') || '';
    }
    const preset = [...BASIC_COLORS, ...EXTENDED_COLORS].find(bg => bg.id === selectedBackground);
    return preset?.url || preset?.color || '';
  };

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

      {/* 基本色パレット */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
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
        
        <div className="grid grid-cols-6 gap-2 mb-3">
          {BASIC_COLORS.map((color) => (
            <button
              key={color.id}
              className={`w-12 h-12 rounded-xl border-2 transition-all ${
                selectedBackground === color.id 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              style={{
                backgroundColor: color.color,
                boxShadow: color.id === 'white' ? 'inset 0 0 0 1px #e5e7eb' : 'none'
              }}
              onClick={() => saveBackground(color.id)}
            >
              {selectedBackground === color.id && (
                <div className="w-full h-full flex items-center justify-center">
                  <Check size={16} className="text-white drop-shadow-sm" />
                </div>
              )}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowExtendedColors(!showExtendedColors)}
        >
          {showExtendedColors ? '基本色のみ表示' : 'もっと多くの色を表示'}
        </Button>

        {showExtendedColors && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {EXTENDED_COLORS.map((color) => (
              <button
                key={color.id}
                className={`h-12 rounded-lg border-2 transition-all relative overflow-hidden ${
                  selectedBackground === color.id 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={{
                  background: color.isGradient ? color.url : color.color
                }}
                onClick={() => saveBackground(color.id)}
              >
                {selectedBackground === color.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check size={16} className="text-white drop-shadow-sm" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
                  {color.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* カスタム画像アップロード */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">カスタム画像</h2>
        
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 border-dashed border-slate-300 hover:border-slate-400 rounded-xl"
            disabled={isUploading}
            onClick={() => document.getElementById('background-upload')?.click()}
          >
            {isUploading ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Upload size={18} className="mr-2" />
                画像をアップロード
              </>
            )}
          </Button>
          
          <input
            id="background-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          
          {customImageUrl && (
            <div className="relative">
              <div 
                className="w-full h-20 rounded-xl bg-cover bg-center border-2 border-slate-200"
                style={{ backgroundImage: `url(${customImageUrl})` }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 w-6 h-6 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={() => {
                  setCustomImageUrl('');
                  resetToDefault();
                }}
              >
                <X size={12} />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 使用上の注意 */}
      <Card className="backdrop-blur-xl bg-white/60 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500">
            アップロードした画像はブラウザに保存されます
          </p>
          <p className="text-xs text-slate-400">
            適切なサイズ: 1200x800px以上推奨
          </p>
        </div>
      </Card>
    </div>
  );
}