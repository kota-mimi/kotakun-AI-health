'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

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

interface BackgroundProviderProps {
  children: React.ReactNode;
}

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const { liffUser } = useAuth();

  useEffect(() => {
    loadAndApplyBackground();
  }, [liffUser]);

  const loadAndApplyBackground = async () => {
    try {
      if (!liffUser?.userId) {
        // LIFF未認証時はlocalStorageから読み込み
        const savedBackground = localStorage.getItem('app-background') || 'white';
        const customColor = localStorage.getItem('app-background-custom-color');
        applyBackground(savedBackground, customColor || undefined);
        return;
      }

      // Firebase から背景設定を取得
      const response = await fetch(`/api/background/settings?userId=${liffUser.userId}`);
      if (response.ok) {
        const { backgroundSettings } = await response.json();
        
        // localStorageも同期
        localStorage.setItem('app-background', backgroundSettings.type);
        if (backgroundSettings.customColor) {
          localStorage.setItem('app-background-custom-color', backgroundSettings.customColor);
        }
        
        applyBackground(backgroundSettings.type, backgroundSettings.customColor);
      } else {
        // API失敗時はlocalStorageにフォールバック
        const savedBackground = localStorage.getItem('app-background') || 'white';
        const customColor = localStorage.getItem('app-background-custom-color');
        applyBackground(savedBackground, customColor || undefined);
      }
    } catch (error) {
      console.error('Failed to load background from Firebase:', error);
      // エラー時はlocalStorageにフォールバック
      const savedBackground = localStorage.getItem('app-background') || 'white';
      const customColor = localStorage.getItem('app-background-custom-color');
      applyBackground(savedBackground, customColor || undefined);
    }
  };

  const applyBackground = (backgroundId: string, customColor?: string) => {
    // 既存のスタイルをクリア
    const existingStyle = document.getElementById('app-background-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 新しいスタイルシートを作成
    const style = document.createElement('style');
    style.id = 'app-background-style';
    
    let backgroundCSS = '';
    
    if (backgroundId === 'custom' && customColor) {
      backgroundCSS = `
        body {
          background: ${customColor} !important;
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

  return <>{children}</>;
}