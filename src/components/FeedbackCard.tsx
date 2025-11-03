import React, { useState } from 'react';
import { Card } from './ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCounselingData } from '@/hooks/useCounselingData';
import { withCounselingGuard } from '@/utils/counselingGuard';

interface FeedbackData {
  date: string;
  feedback: string;
  foodEvaluation: {
    goodPoints: string;
    improvements: string;
  };
  exerciseEvaluation: {
    goodPoints: string;
    improvements: string;
  };
}

interface FeedbackCardProps {
  feedbackData: FeedbackData | null;
  isLoading: boolean;
  hasFeedbackData: boolean;
  onGenerateFeedback: () => void;
  selectedDate: Date;
  onNavigateToCounseling?: () => void;
}

export function FeedbackCard({ 
  feedbackData, 
  isLoading, 
  hasFeedbackData, 
  onGenerateFeedback,
  selectedDate,
  onNavigateToCounseling
}: FeedbackCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    food: false,
    exercise: false
  });
  
  // カウンセリング状態を取得
  const { counselingResult } = useCounselingData();
  
  // 直接フィードバック生成関数を使用（カウンセリングガード削除）
  const handleGenerateFeedback = onGenerateFeedback;
  
  // 今日の日付かチェック
  const isToday = () => {
    const today = new Date();
    const dateKey = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const todayKey = today.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    return dateKey === todayKey;
  };

  // 未来の日付かチェック
  const isFutureDate = () => {
    const today = new Date();
    const dateKey = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const todayKey = today.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    return dateKey > todayKey;
  };

  const toggleSection = (section: 'food' | 'exercise') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 未来の日付の場合は表示しない
  if (isFutureDate()) {
    return null;
  }

  return (
    <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 overflow-hidden">
      <div className="p-3">
        {/* ヘッダー */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="text-lg font-semibold text-slate-900">
              フィードバック
            </div>
            {hasFeedbackData && (
              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                データあり
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </div>
        </div>

        {/* 展開コンテンツ */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">フィードバックを生成中...</p>
              </div>
            )}

            {!isLoading && !hasFeedbackData && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-600">
                  この日のフィードバックデータがありません。
                </p>
              </div>
            )}

            {!isLoading && feedbackData && (
              <div className="space-y-3">
                {/* 食事評価セクション */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-blue-50 px-4 py-3 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleSection('food')}
                  >
                    <h3 className="font-semibold text-blue-900">食事評価</h3>
                    {expandedSections.food ? (
                      <ChevronUp className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  {expandedSections.food && (
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-green-700">良かった点</h4>
                        <div className="text-sm text-slate-700">
                          {feedbackData.foodEvaluation.goodPoints.split('\n').map((line, index) => (
                            <div key={index} className="leading-none">{line}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-700">改善点</h4>
                        <div className="text-sm text-slate-700">
                          {feedbackData.foodEvaluation.improvements.split('\n').map((line, index) => (
                            <div key={index} className="leading-none">{line}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 運動評価セクション */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-blue-50 px-4 py-3 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleSection('exercise')}
                  >
                    <h3 className="font-semibold text-blue-900">運動評価</h3>
                    {expandedSections.exercise ? (
                      <ChevronUp className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  {expandedSections.exercise && (
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-green-700">良かった点</h4>
                        <div className="text-sm text-slate-700">
                          {feedbackData.exerciseEvaluation.goodPoints.split('\n').map((line, index) => (
                            <div key={index} className="leading-none">{line}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-700">改善提案</h4>
                        <div className="text-sm text-slate-700">
                          {feedbackData.exerciseEvaluation.improvements.split('\n').map((line, index) => (
                            <div key={index} className="leading-none">{line}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}