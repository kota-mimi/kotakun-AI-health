import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getCharacterPersona } from '@/utils/aiCharacterUtils';
import type { AICharacterSettings, AICharacterPersona } from '@/types';

interface AICharacterPageProps {
  onBack: () => void;
}

export function AICharacterPage({ onBack }: AICharacterPageProps) {
  // 固定設定（ヘルシーくんのみ）
  const selectedCharacter: AICharacterSettings = {
    type: 'healthy_kun',
    language: 'ja'
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

      {/* ヘルシーくん固定表示 */}
      <div className="px-4">
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              ヘルシーくん
            </h3>
            <Badge variant="outline" className="mb-4">
              親しみやすい・自然
            </Badge>
            <p className="text-slate-600 mb-4">
              {currentPersona.greeting}
            </p>
            <p className="text-sm text-slate-500">
              親しみやすく経験豊富なパーソナルトレーナー兼栄養管理士として、気さくで話しやすい自然な口調で健康サポートを行います。
            </p>
          </div>
        </Card>
      </div>

      {/* 言語選択 - 一時的に無効化（将来的に復活予定）
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
      */}

      {/* 説明メッセージ */}
      <div className="px-4 pt-8 pb-24">
        <div className="text-center text-slate-600 text-sm">
          ヘルシーくんが親しみやすい口調で<br />
          あなたの健康管理をサポートします！
        </div>
        <Button 
          onClick={onBack}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
        >
          戻る
        </Button>
      </div>

    </div>
  );
}