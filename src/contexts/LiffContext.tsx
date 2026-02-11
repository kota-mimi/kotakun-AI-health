'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { LIFFUser, LIFFContext as LIFFContextType } from '@/types';

interface LiffState {
  isReady: boolean;
  isLoggedIn: boolean;
  user: LIFFUser | null;
  context: LIFFContextType | null;
  error: string | null;
  isInClient: boolean;
}

interface LiffContextValue extends LiffState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  closeWindow: () => void;
  sendMessage: (message: string) => Promise<void>;
  openWindow: (url: string, external?: boolean) => void;
}

const LiffContext = createContext<LiffContextValue | null>(null);

interface LiffProviderProps {
  children: ReactNode;
}

export function LiffProvider({ children }: LiffProviderProps) {
  const [state, setState] = useState<LiffState>({
    isReady: false,
    isLoggedIn: false,
    user: null,
    context: null,
    error: null,
    isInClient: false,
  });

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        
        // ブラウザ環境チェック
        if (typeof window === 'undefined') {
          return;
        }
        
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        
        if (!liffId) {
          setState(prev => ({
            ...prev,
            error: null, // エラーではなく警告として扱う
            isReady: true,
            isLoggedIn: false, // ログイン状態はfalse
          }));
          return;
        }

        // Dynamic import to avoid SSR issues
        const liff = (await import('@line/liff')).default;
        
        // 開発環境でLIFF IDがないか、LIFF環境外の場合はテストユーザーを設定
        if (process.env.NODE_ENV === 'development' && !window.location.href.includes('liff')) {
          setState(prev => ({
            ...prev,
            error: null,
            isReady: true,
            isLoggedIn: true, // テスト用にログイン状態にする
            user: {
              userId: 'test_user_id', // 開発環境テスト用ID
              displayName: 'テストユーザー',
              pictureUrl: '',
              statusMessage: '',
            },
            isInClient: true,
          }));
          return;
        }
        
        await liff.init({ liffId });
        
        const isLoggedIn = liff.isLoggedIn();
        const isInClient = liff.isInClient();
        
        
        let user: LIFFUser | null = null;
        let context: LIFFContextType | null = null;

        if (isLoggedIn) {
          try {
            const profile = await liff.getProfile();
            user = {
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              statusMessage: profile.statusMessage,
            };
          } catch (profileError) {
            console.error('⚠️ プロフィール取得エラー:', profileError);
            // プロフィール取得エラーは致命的でない
          }

          try {
            context = liff.getContext();
          } catch (contextError) {
            console.error('⚠️ コンテキスト取得エラー:', contextError);
            // コンテキスト取得エラーは致命的でない
          }
        }

        setState({
          isReady: true,
          isLoggedIn,
          user,
          context,
          error: null,
          isInClient,
        });


      } catch (error: any) {
        console.error('❌ LIFF初期化エラー:', error);
        
        // LIFFエラーフラグを設定
        try {
          sessionStorage.setItem('liff_error', 'true');
          sessionStorage.setItem('liff_error_message', error.message || 'Unknown LIFF error');
        } catch (e) {
          console.error('SessionStorage write error:', e);
        }
        
        // 本番環境では最低限の機能で続行
        if (process.env.NODE_ENV === 'production') {
          setState({
            isReady: true,
            isLoggedIn: false,
            user: null,
            context: null,
            error: null, // エラーを隠して続行
            isInClient: false,
          });
        } else {
          setState(prev => ({
            ...prev,
            error: error.message || 'LIFF初期化に失敗しました',
            isReady: true,
          }));
        }
      }
    };

    initializeLiff();
  }, []);

  const login = async () => {
    try {
      const liff = (await import('@line/liff')).default;
      
      if (!liff.isLoggedIn()) {
        // LINEアプリ外での開発環境では自動ログインしない
        if (process.env.NODE_ENV === 'development' && !window.location.href.includes('liff')) {
          console.log('Development mode: Skipping LIFF login');
          return;
        }
        
        liff.login({
          redirectUri: window.location.href,
        });
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'ログインに失敗しました',
      }));
    }
  };

  const logout = async () => {
    try {
      const liff = (await import('@line/liff')).default;
      
      if (liff.isLoggedIn()) {
        liff.logout();
        setState(prev => ({
          ...prev,
          isLoggedIn: false,
          user: null,
          context: null,
        }));
      }
    } catch (error: any) {
      console.error('ログアウトエラー:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'ログアウトに失敗しました',
      }));
    }
  };

  const closeWindow = () => {
    import('@line/liff').then(({ default: liff }) => {
      if (liff.isInClient()) {
        liff.closeWindow();
      }
    });
  };

  const sendMessage = async (message: string) => {
    try {
      const liff = (await import('@line/liff')).default;
      
      if (liff.isInClient()) {
        await liff.sendMessages([
          {
            type: 'text',
            text: message,
          },
        ]);
      } else {
        console.warn('LINEクライアント内ではないため、メッセージを送信できません');
      }
    } catch (error: any) {
      console.error('メッセージ送信エラー:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'メッセージ送信に失敗しました',
      }));
    }
  };

  const openWindow = (url: string, external: boolean = false) => {
    import('@line/liff').then(({ default: liff }) => {
      if (liff.isInClient()) {
        liff.openWindow({
          url,
          external,
        });
      } else {
        window.open(url, external ? '_blank' : '_self');
      }
    });
  };

  const contextValue: LiffContextValue = {
    ...state,
    login,
    logout,
    closeWindow,
    sendMessage,
    openWindow,
  };

  return (
    <LiffContext.Provider value={contextValue}>
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  const context = useContext(LiffContext);
  
  if (!context) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  
  return context;
}