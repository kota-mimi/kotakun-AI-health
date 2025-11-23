import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSharedProfile } from '@/hooks/useSharedProfile';
import { CHARACTER_PERSONAS, getCharacterPersona } from '@/utils/aiCharacterUtils';
import type { AICharacterSettings, AICharacterPersona } from '@/types';

interface AICharacterPageProps {
  onBack: () => void;
}

export function AICharacterPage({ onBack }: AICharacterPageProps) {
  const { liffUser } = useAuth();
  const { latestProfile, refetch: refetchProfile } = useSharedProfile();
  
  const [selectedCharacter, setSelectedCharacter] = useState<AICharacterSettings>({
    type: 'healthy_kun'
  });
  const [isSaving, setIsSaving] = useState(false);

  // 現在の設定を読み込み
  useEffect(() => {
    if (latestProfile?.aiCharacter) {
      setSelectedCharacter(latestProfile.aiCharacter);
    }
  }, [latestProfile]);

  // キャラクター選択
  const handleCharacterSelect = (type: 'healthy_kun' | 'sparta') => {
    setSelectedCharacter({ type });
  };


  // 設定保存
  const handleSaveSettings = async () => {
    if (!liffUser?.userId) return;

    setIsSaving(true);
    
    try {
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
    <div className="space-y-6 pb-4">
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
                {selectedCharacter.type === 'healthy_kun' ? '優しい・丁寧' : '鬼軍曹'}
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
        <h2 className="text-lg font-semibold text-slate-800">キャラクターを選択</h2>
        
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
                  丁寧語で親しみやすく、ペースを大切にする優しいサポート
                </p>
                <Badge variant="outline">優しい・丁寧</Badge>
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
                  鬼コーチ
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  軍隊式の厳格指導、結果を出した時だけ少し優しくなる
                </p>
                <Badge variant="destructive">鬼軍曹</Badge>
              </div>
              <div className="text-4xl">💪</div>
            </div>
          </div>
        </Card>

      </div>

      {/* 保存ボタン */}
      <div className="px-4 pt-4">
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