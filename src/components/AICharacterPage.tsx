import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSharedProfile } from '@/hooks/useSharedProfile';
import type { AICharacterSettings, AICharacterPersona } from '@/types';

// 定義済みキャラクターのペルソナ
const CHARACTER_PERSONAS: Record<string, AICharacterPersona> = {
  healthy_kun: {
    name: 'ヘルシーくん',
    personality: '優しく丁寧で、ユーザーのペースを大切にする',
    tone: '丁寧語で親しみやすく話す',
    greeting: 'お疲れさまです！今日も健康管理頑張りましょうね😊',
    encouragement: [
      '素晴らしい頑張りですね！',
      '継続することが一番大切です',
      '小さな変化も積み重ねが大事ですよ'
    ],
    warnings: [
      '少し食べ過ぎかもしれません。明日調整していきましょう',
      '運動不足が気になります。軽いストレッチから始めてみませんか？'
    ],
    feedbackStyle: '穏やかで建設的な指導'
  },
  sparta: {
    name: '鬼コーチ',
    personality: '厳しいが愛のあるスパルタ指導',
    tone: 'ストレートで力強い口調',
    greeting: 'よし！今日も気合い入れて行くぞ！💪',
    encouragement: [
      'その調子だ！もっと行けるぞ！',
      '甘えるな！結果を出すんだ！',
      '限界を超えて成長しろ！'
    ],
    warnings: [
      'なんだその食事は！目標を思い出せ！',
      'サボってる場合か！今すぐ動け！'
    ],
    feedbackStyle: '厳しく直球な指導'
  }
};

interface AICharacterPageProps {
  onBack: () => void;
}

export function AICharacterPage({ onBack }: AICharacterPageProps) {
  const { liffUser } = useAuth();
  const { latestProfile, refetch: refetchProfile } = useSharedProfile();
  
  const [selectedCharacter, setSelectedCharacter] = useState<AICharacterSettings>({
    type: 'healthy_kun'
  });
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    personality: '',
    tone: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // 現在の設定を読み込み
  useEffect(() => {
    if (latestProfile?.aiCharacter) {
      setSelectedCharacter(latestProfile.aiCharacter);
      if (latestProfile.aiCharacter.type === 'custom') {
        setCustomSettings({
          personality: latestProfile.aiCharacter.customPersonality || '',
          tone: latestProfile.aiCharacter.customTone || ''
        });
      }
    }
  }, [latestProfile]);

  // キャラクター選択
  const handleCharacterSelect = (type: 'healthy_kun' | 'sparta' | 'custom') => {
    if (type === 'custom') {
      setIsCustomModalOpen(true);
    } else {
      setSelectedCharacter({ type });
    }
  };

  // カスタムキャラクター設定
  const handleCustomSave = () => {
    setSelectedCharacter({
      type: 'custom',
      customPersonality: customSettings.personality,
      customTone: customSettings.tone
    });
    setIsCustomModalOpen(false);
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

  const getCurrentPersona = (): AICharacterPersona | null => {
    if (selectedCharacter.type === 'custom') {
      return {
        name: 'ヘルシーくん', // LINEの表示名は固定
        personality: selectedCharacter.customPersonality || '',
        tone: selectedCharacter.customTone || '',
        greeting: 'こんにちは！',
        encouragement: ['頑張って！'],
        warnings: ['注意が必要です'],
        feedbackStyle: 'カスタム指導'
      };
    }
    return CHARACTER_PERSONAS[selectedCharacter.type] || null;
  };

  const currentPersona = getCurrentPersona();

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
                {selectedCharacter.type === 'healthy_kun' ? 'やさしい' :
                 selectedCharacter.type === 'sparta' ? 'スパルタ' : 'カスタム'}
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
                  優しく丁寧にサポートします
                </p>
                <Badge variant="outline">やさしい</Badge>
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
                  厳しく愛のあるスパルタ指導
                </p>
                <Badge variant="destructive">スパルタ</Badge>
              </div>
              <div className="text-4xl">💪</div>
            </div>
          </div>
        </Card>

        {/* カスタム */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedCharacter.type === 'custom' 
              ? 'bg-purple-50 border-purple-300 shadow-lg' 
              : 'bg-white/80 border border-white/20'
          } backdrop-blur-xl rounded-xl shadow-xl`}
          onClick={() => handleCharacterSelect('custom')}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">
                  カスタムキャラクター
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  自分好みにカスタマイズ
                </p>
                <Badge variant="secondary">カスタム</Badge>
              </div>
              <div className="text-4xl">🎭</div>
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

      {/* カスタムキャラクター設定モーダル */}
      <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
        <DialogContent className="max-w-sm mx-auto my-8">
          <DialogHeader>
            <DialogTitle className="text-center">カスタムキャラクター設定</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">性格・特徴</label>
              <Textarea
                value={customSettings.personality}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, personality: e.target.value }))}
                placeholder="例: フレンドリーで明るい、時には厳しく的確なアドバイスをくれる"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">口調・話し方</label>
              <Textarea
                value={customSettings.tone}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, tone: e.target.value }))}
                placeholder="例: タメ口で親しみやすく、絵文字をよく使う"
                rows={3}
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCustomModalOpen(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleCustomSave}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              設定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}