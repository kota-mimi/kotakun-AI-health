import { useEffect } from 'react';

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

interface BackgroundProviderProps {
  children: React.ReactNode;
}

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  useEffect(() => {
    // 保存された背景設定を読み込み
    const savedBackground = localStorage.getItem('app-background') || 'gradient1';
    const customUrl = localStorage.getItem('app-background-custom-url');
    
    applyBackground(savedBackground, customUrl || undefined);
  }, []);

  const applyBackground = (backgroundId: string, customUrl?: string) => {
    const body = document.body;
    
    // 既存の背景スタイルをクリア
    body.style.background = '';
    body.style.backgroundImage = '';
    body.style.backgroundSize = '';
    body.style.backgroundPosition = '';
    body.style.backgroundAttachment = '';
    
    if (backgroundId === 'custom' && customUrl) {
      body.style.backgroundImage = `url(${customUrl})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundAttachment = 'fixed';
      body.style.minHeight = '100vh';
    } else {
      const preset = PRESET_BACKGROUNDS.find(bg => bg.id === backgroundId);
      if (preset) {
        if (preset.isGradient) {
          body.style.background = preset.url;
          body.style.minHeight = '100vh';
        } else {
          body.style.backgroundImage = `url(${preset.url})`;
          body.style.backgroundSize = 'cover';
          body.style.backgroundPosition = 'center';
          body.style.backgroundAttachment = 'fixed';
          body.style.minHeight = '100vh';
        }
      }
    }
  };

  return <>{children}</>;
}