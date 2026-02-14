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

const PRESET_BACKGROUNDS = [
  {
    id: 'gradient1',
    name: 'ヘルシーグラデーション',
    url: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    isGradient: true
  },
  {
    id: 'gradient2',
    name: 'フレッシュグリーン',
    url: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    isGradient: true
  },
  {
    id: 'gradient3',
    name: 'オーシャンブルー',
    url: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    isGradient: true
  },
  {
    id: 'unsplash1',
    name: 'モーニングヨガ',
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    isGradient: false
  },
  {
    id: 'unsplash2',
    name: 'フレッシュサラダ',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    isGradient: false
  },
  {
    id: 'unsplash3',
    name: 'トレーニング',
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    isGradient: false
  }
];

export function BackgroundSettingsPage({ onBack }: BackgroundSettingsPageProps) {
  const [selectedBackground, setSelectedBackground] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // 現在の背景設定を読み込み
  useEffect(() => {
    const savedBackground = localStorage.getItem('app-background') || 'gradient1';
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
    const body = document.body;
    body.className = body.className.replace(/bg-\S+/g, '');
    
    if (backgroundId === 'custom' && customUrl) {
      body.style.backgroundImage = `url(${customUrl})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundAttachment = 'fixed';
    } else {
      const preset = PRESET_BACKGROUNDS.find(bg => bg.id === backgroundId);
      if (preset) {
        if (preset.isGradient) {
          body.style.background = preset.url;
        } else {
          body.style.backgroundImage = `url(${preset.url})`;
          body.style.backgroundSize = 'cover';
          body.style.backgroundPosition = 'center';
          body.style.backgroundAttachment = 'fixed';
        }
      }
    }
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
    saveBackground('gradient1');
    setCustomImageUrl('');
    localStorage.removeItem('app-background-custom-url');
  };

  const getCurrentBackground = () => {
    if (selectedBackground === 'custom') {
      return localStorage.getItem('app-background-custom-url') || '';
    }
    return PRESET_BACKGROUNDS.find(bg => bg.id === selectedBackground)?.url || '';
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

      {/* 現在の背景プレビュー */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">現在の背景</h2>
        <div 
          className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center"
          style={{
            background: selectedBackground === 'custom' ? 
              `url(${getCurrentBackground()})` : 
              PRESET_BACKGROUNDS.find(bg => bg.id === selectedBackground)?.isGradient ? 
                PRESET_BACKGROUNDS.find(bg => bg.id === selectedBackground)?.url :
                `url(${getCurrentBackground()})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!getCurrentBackground() && (
            <div className="text-center text-slate-500">
              <ImageIcon size={32} className="mx-auto mb-2" />
              <p className="text-sm">背景未設定</p>
            </div>
          )}
        </div>
      </Card>

      {/* プリセット背景 */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">プリセット背景</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            className="text-slate-600 hover:text-slate-800"
          >
            <RefreshCw size={16} className="mr-1" />
            デフォルト
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {PRESET_BACKGROUNDS.map((bg) => (
            <Button
              key={bg.id}
              variant="ghost"
              className={`relative h-20 p-1 rounded-xl border-2 transition-all ${
                selectedBackground === bg.id 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => saveBackground(bg.id)}
            >
              <div 
                className="w-full h-full rounded-lg"
                style={{
                  background: bg.isGradient ? bg.url : `url(${bg.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {selectedBackground === bg.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                    <Check size={20} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">{bg.name}</p>
            </Button>
          ))}
        </div>
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