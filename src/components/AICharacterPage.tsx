import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSharedProfile } from '@/hooks/useSharedProfile';
import { CHARACTER_PERSONAS, getCharacterPersona, SUPPORTED_LANGUAGES } from '@/utils/aiCharacterUtils';
import type { AICharacterSettings, AICharacterPersona } from '@/types';

interface AICharacterPageProps {
  onBack: () => void;
}

export function AICharacterPage({ onBack }: AICharacterPageProps) {
  const { liffUser } = useAuth();
  const { latestProfile, refetch: refetchProfile } = useSharedProfile();
  
  const [selectedCharacter, setSelectedCharacter] = useState<AICharacterSettings>({
    type: 'healthy_kun',
    language: 'ja'
  });
  const [isSaving, setIsSaving] = useState(false);

  // 現在の設定を読み込み
  useEffect(() => {
    if (latestProfile?.aiCharacter) {
      setSelectedCharacter({
        type: latestProfile.aiCharacter.type,
        language: latestProfile.aiCharacter.language || 'ja' // デフォルト日本語
      });
    }
  }, [latestProfile]);

  // キャラクター選択
  const handleCharacterSelect = (type: 'healthy_kun' | 'sparta') => {
    setSelectedCharacter(prev => ({ ...prev, type }));
  };

  // 言語選択
  const handleLanguageSelect = (language: string) => {
    setSelectedCharacter(prev => ({ ...prev, language: language as any }));
  };


  // 設定保存
  const handleSaveSettings = async () => {
    if (!liffUser?.userId) return;

    setIsSaving(true);
    
    try {
      console.log('🎭 保存するキャラクター設定:', selectedCharacter);
      
      // プロフィールに AIキャラクター設定を保存
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId: liffUser.userId,
          profileData: {
            ...latestProfile,
            aiCharacter: selectedCharacter,
            changeDate: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
          }
        })
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      // プロフィールを再取得
      await refetchProfile();
      
      // 保存完了通知
      alert('AIキャラクターの設定を保存しました！');
      onBack();
      
    } catch (error) {
      console.error('AIキャラクター設定保存エラー:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPersona = getCharacterPersona(selectedCharacter);

  return (
    <div className="space-y-6 pb-32 min-h-screen overflow-y-auto">
      {/* ヘッダー */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            ← 戻る
          </Button>
          <h1 className="text-xl font-bold text-slate-900">AIキャラクター設定</h1>
          <div></div>
        </div>
      </div>

      {/* 現在の設定プレビュー */}
      {currentPersona && (
        <div className="px-4">
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 p-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {currentPersona.name}
              </h3>
              <Badge variant="outline" className="mb-3">
                {selectedCharacter.type === 'healthy_kun' ? '親しみやすい・自然' : '豹変・鬼モード'}
              </Badge>
              <p className="text-sm text-slate-600 mb-3">
                {currentPersona.greeting}
              </p>
              <div className="text-xs text-slate-500">
                <p>性格: {currentPersona.personality}</p>
                <p>口調: {currentPersona.tone}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* キャラクター選択 */}
      <div className="px-4 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">🎭 AIキャラクター</h2>
        
        {/* ヘルシーくん */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedCharacter.type === 'healthy_kun' 
              ? 'bg-blue-50 border-blue-300 shadow-lg' 
              : 'bg-white/80 border border-white/20'
          } backdrop-blur-xl rounded-xl shadow-xl`}
          onClick={() => handleCharacterSelect('healthy_kun')}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">
                  ヘルシーくん（標準）
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  親しみやすくて自然な口調で楽しく健康サポート
                </p>
                <Badge variant="outline">親しみやすい・自然</Badge>
              </div>
              <div className="text-4xl">😊</div>
            </div>
          </div>
        </Card>

        {/* 鬼スパルタ */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedCharacter.type === 'sparta' 
              ? 'bg-red-50 border-red-300 shadow-lg' 
              : 'bg-white/80 border border-white/20'
          } backdrop-blur-xl rounded-xl shadow-xl`}
          onClick={() => handleCharacterSelect('sparta')}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">
                  ヘルシーくん（鬼モード）
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  普段の優しさを封印、豹変して容赦ない厳格指導
                </p>
                <Badge variant="destructive">豹変・鬼モード</Badge>
              </div>
              <div className="text-4xl">😈</div>
            </div>
          </div>
        </Card>

      </div>

      {/* 言語選択 */}
      <div className="px-4 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">🌍 応答言語</h2>
        <p className="text-sm text-slate-600 mb-3">AIの応答で使用する言語を選択してください</p>
        
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <Card 
              key={code}
              className={`cursor-pointer transition-all ${
                selectedCharacter.language === code 
                  ? 'bg-green-50 border-green-300 shadow-lg ring-2 ring-green-200' 
                  : 'bg-white/80 border border-white/20 hover:border-green-200'
              } backdrop-blur-xl rounded-xl shadow-xl`}
              onClick={() => handleLanguageSelect(code)}
            >
              <div className="p-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {code === 'ja' && '🇯🇵'}
                    {code === 'en' && '🇺🇸'}
                    {code === 'ko' && '🇰🇷'}
                    {code === 'zh' && '🇨🇳'}
                    {code === 'es' && '🇪🇸'}
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {name}
                  </div>
                  {selectedCharacter.language === code && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      選択中
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>

      {/* 保存ボタン */}
      <div className="px-4 pt-8 pb-24">
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '設定を保存'}
        </Button>
      </div>

    </div>
  );
}