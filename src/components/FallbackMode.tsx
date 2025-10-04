'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface FallbackModeProps {
  children: React.ReactNode;
}

export function FallbackMode({ children }: FallbackModeProps) {
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // 本番環境でのフォールバックモード自動判定
    const checkForFallbackMode = () => {
      try {
        // LIFFエラーまたは初期化問題を検出
        const hasLiffError = sessionStorage.getItem('liff_error') === 'true';
        const isProductionWithoutLiff = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_LIFF_ID;
        
        if (hasLiffError || isProductionWithoutLiff) {
          console.log('🔧 フォールバックモードを有効化');
          setIsFallbackMode(true);
        }
      } catch (error) {
        console.error('フォールバックモード判定エラー:', error);
        setIsFallbackMode(true);
      }
    };

    checkForFallbackMode();
  }, []);

  // サーバーサイドでは何も表示しない
  if (!isClient) {
    return null;
  }

  if (isFallbackMode) {
    return <FallbackApp onBackToNormal={() => setIsFallbackMode(false)} />;
  }

  return (
    <>
      {children}
      <FallbackModeToggle onActivate={() => setIsFallbackMode(true)} />
    </>
  );
}

function FallbackModeToggle({ onActivate }: { onActivate: () => void }) {
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    // 開発環境またはエラー時にトグルを表示
    const timer = setTimeout(() => {
      if (process.env.NODE_ENV === 'development' || sessionStorage.getItem('app_error') === 'true') {
        setShowToggle(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!showToggle) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={onActivate}
        variant="outline"
        size="sm"
        className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
      >
        🔧 セーフモード
      </Button>
    </div>
  );
}

function FallbackApp({ onBackToNormal }: { onBackToNormal: () => void }) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [counselingData, setCounselingData] = useState<any>(null);

  useEffect(() => {
    // ローカルストレージからデータを読み込み
    try {
      const profile = localStorage.getItem('userProfile');
      const counseling = localStorage.getItem('counselingAnswers');
      const analysis = localStorage.getItem('aiAnalysis');

      if (profile) setUserProfile(JSON.parse(profile));
      if (counseling && analysis) {
        setCounselingData({
          answers: JSON.parse(counseling),
          aiAnalysis: JSON.parse(analysis)
        });
      }
    } catch (error) {
      console.error('ローカルデータ読み込みエラー:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">セーフモード</h3>
              <p className="text-sm text-yellow-700">ローカルデータで動作中</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onBackToNormal} 
              className="w-full"
              variant="outline"
            >
              通常モードに戻る
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
              variant="default"
            >
              ページを再読み込み
            </Button>
          </div>
        </Card>

        {/* ユーザープロフィール表示 */}
        {userProfile && (
          <Card className="p-4">
            <h4 className="font-semibold mb-2">保存済みプロフィール</h4>
            <div className="text-sm space-y-1">
              <p>名前: {userProfile.name || 'ユーザー'}</p>
              <p>年齢: {userProfile.age || '-'}歳</p>
              <p>身長: {userProfile.height || '-'}cm</p>
              <p>体重: {userProfile.weight || '-'}kg</p>
            </div>
          </Card>
        )}

        {/* カウンセリング結果表示 */}
        {counselingData && (
          <Card className="p-4">
            <h4 className="font-semibold mb-2">カウンセリング結果</h4>
            <div className="text-sm space-y-1">
              <p>目標体重: {counselingData.answers?.targetWeight || '-'}kg</p>
              <p>目標カロリー: {counselingData.aiAnalysis?.nutritionPlan?.dailyCalories || '-'}kcal</p>
              {counselingData.aiAnalysis?.nutritionPlan?.macros && (
                <div>
                  <p>タンパク質: {counselingData.aiAnalysis.nutritionPlan.macros.protein}g</p>
                  <p>脂質: {counselingData.aiAnalysis.nutritionPlan.macros.fat}g</p>
                  <p>炭水化物: {counselingData.aiAnalysis.nutritionPlan.macros.carbs}g</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* カウンセリングへのリンク */}
        <Card className="p-4">
          <h4 className="font-semibold mb-2">利用可能な機能</h4>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/counseling'} 
              className="w-full" 
              variant="outline"
            >
              健康カウンセリング
            </Button>
            
            <Button 
              onClick={() => {
                // ローカルデータをクリア
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }} 
              className="w-full" 
              variant="destructive"
            >
              全データをクリア
            </Button>
          </div>
        </Card>
        
        <div className="text-center text-xs text-gray-500 mt-6">
          セーフモード v1.0 - ローカルストレージベース
        </div>
      </div>
    </div>
  );
}