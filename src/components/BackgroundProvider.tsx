'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

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
        const customUrl = localStorage.getItem('app-background-custom-url');
        applyBackground(savedBackground, customUrl || undefined);
        return;
      }

      // Firebase から背景設定を取得
      const response = await fetch(`/api/background/settings?userId=${liffUser.userId}`);
      if (response.ok) {
        const { backgroundSettings } = await response.json();
        
        // localStorageも同期
        localStorage.setItem('app-background', backgroundSettings.type);
        if (backgroundSettings.imageUrl) {
          localStorage.setItem('app-background-custom-url', backgroundSettings.imageUrl);
        } else {
          localStorage.removeItem('app-background-custom-url');
        }
        
        applyBackground(backgroundSettings.type, backgroundSettings.imageUrl);
      } else {
        // API失敗時はlocalStorageにフォールバック
        const savedBackground = localStorage.getItem('app-background') || 'white';
        const customUrl = localStorage.getItem('app-background-custom-url');
        applyBackground(savedBackground, customUrl || undefined);
      }
    } catch (error) {
      console.error('Failed to load background from Firebase:', error);
      // エラー時はlocalStorageにフォールバック
      const savedBackground = localStorage.getItem('app-background') || 'white';
      const customUrl = localStorage.getItem('app-background-custom-url');
      applyBackground(savedBackground, customUrl || undefined);
    }
  };

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

  return <>{children}</>;
}