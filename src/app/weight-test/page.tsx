'use client';

import React from 'react';
import { useDateBasedData } from '@/hooks/useDateBasedData';
import { useNavigationState } from '@/hooks/useNavigationState';
import { useWeightData } from '@/hooks/useWeightData';
import { useCounselingData } from '@/hooks/useCounselingData';
import { useSharedProfile } from '@/hooks/useSharedProfile';
import { useDashboardData } from '@/hooks/useDashboardData';
import { WeightCard } from '@/components/WeightCard';
import { Card } from '@/components/ui/card';

// 修正版WeightCardコンポーネント
interface WeightData {
  current: number;
  previous: number;
  target: number;
}

interface WeightCardFastProps {
  data: WeightData;
  onNavigateToWeight?: () => void;
  counselingResult?: any;
  selectedDate?: Date;
  sharedProfile?: { latestProfile: any };
}

function WeightCardFast({
  data,
  onNavigateToWeight,
  counselingResult,
  selectedDate,
  sharedProfile,
}: WeightCardFastProps) {
  // 未来日付かどうかの判定
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  });
  const selectedDateKey =
    selectedDate?.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }) ||
    today;
  const isFutureDate = selectedDateKey > today;

  // シンプルな表示ロジック
  const hasCurrentData = data.current > 0;
  const hasPreviousData = data.previous > 0;
  const hasTargetData = data.target > 0;

  // 健康維持モードチェック
  const isMaintenanceMode =
    counselingResult?.answers?.primaryGoal === "maintenance";
  const shouldShowTarget = hasTargetData && !isMaintenanceMode;

  // 🚀 修正版：sharedProfile優先の体重表示
  const currentWeight = data.current > 0 ? data.current : 
                       (sharedProfile?.latestProfile?.weight ||
                        counselingResult?.answers?.weight || 
                        counselingResult?.userProfile?.weight || 0);
  const shouldShowWeight = !isFutureDate && currentWeight > 0;

  // 前日比計算
  const difference =
    hasCurrentData && hasPreviousData ? currentWeight - data.previous : 0;
  const shouldShowDifference = hasCurrentData && hasPreviousData;
  const isDecrease = difference < 0;

  // 目標体重取得
  const targetWeight = data.target > 0 ? data.target : 
                       (counselingResult?.answers?.targetWeight || 0);
  
  // 目標までの計算
  const canCalculateRemaining =
    !isFutureDate && currentWeight > 0 && targetWeight > 0 && !isMaintenanceMode;
  const remaining = canCalculateRemaining
    ? Math.abs(currentWeight - targetWeight)
    : 0;

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {/* 現在の体重 */}
          <div
            className="text-center p-2 bg-gradient-to-br from-green-50 to-green-100/80 rounded-xl border border-green-200/50 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
              現在（高速版）
            </div>
            <div className="text-lg font-bold text-slate-900">
              {shouldShowWeight
                ? currentWeight % 1 === 0
                  ? currentWeight.toString()
                  : currentWeight.toFixed(1)
                : "--"}
              {shouldShowWeight && (
                <span className="text-sm font-medium text-slate-600 ml-1">
                  kg
                </span>
              )}
            </div>
          </div>

          {/* 前日比 */}
          <div
            className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">
              前日比
            </div>
            <div
              className={`text-lg font-bold ${
                shouldShowDifference && isDecrease
                  ? "text-green-600"
                  : shouldShowDifference
                    ? "text-orange-600"
                    : "text-slate-900"
              }`}
            >
              {shouldShowDifference ? (
                <>
                  {isDecrease ? "" : "+"}
                  {difference.toFixed(1)}
                  <span className="text-sm font-medium text-slate-600 ml-1">
                    kg
                  </span>
                </>
              ) : (
                "--"
              )}
            </div>
          </div>

          {/* 目標まで */}
          <div
            className="text-center p-2 bg-green-50 rounded-xl border border-green-200 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">
              目標まで
            </div>
            <div className="text-lg font-bold">
              {canCalculateRemaining ? (
                currentWeight === targetWeight ? (
                  <span className="text-green-600">🎉 達成</span>
                ) : currentWeight > targetWeight ? (
                  <span className="text-red-600">
                    -{remaining.toFixed(1)}
                    <span className="text-sm font-medium text-slate-600 ml-1">
                      kg
                    </span>
                  </span>
                ) : (
                  <span className="text-green-600">
                    +{remaining.toFixed(1)}
                    <span className="text-sm font-medium text-slate-600 ml-1">
                      kg
                    </span>
                  </span>
                )
              ) : (
                <span className="text-slate-900">--</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function WeightTestPage() {
  const [isClient, setIsClient] = React.useState(false);
  const [weightInput, setWeightInput] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const navigation = useNavigationState();
  const dateBasedDataManager = useDateBasedData();
  const sharedProfile = useSharedProfile();
  const dashboardData = useDashboardData(navigation?.selectedDate || new Date());
  
  const counselingResult = dashboardData.counselingData;
  
  const weightManager = useWeightData(
    navigation?.selectedDate || new Date(),
    dateBasedDataManager?.dateBasedData || {},
    dateBasedDataManager?.updateDateBasedData || (() => {}),
    counselingResult,
    sharedProfile
  );

  // 体重記録機能
  const handleWeightRecord = async () => {
    if (!weightInput || isRecording) return;
    
    setIsRecording(true);
    try {
      const weight = parseFloat(weightInput);
      if (isNaN(weight) || weight <= 0) {
        alert('正しい体重を入力してください');
        return;
      }

      const selectedDate = navigation?.selectedDate || new Date();
      const dateKey = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      
      console.log('🎯 体重記録開始:', { weight, dateKey });
      
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight, date: dateKey })
      });

      if (response.ok) {
        console.log('✅ 体重記録完了');
        setWeightInput('');
        
        // データ更新をトリガー
        if (dateBasedDataManager?.updateDateBasedData) {
          await dateBasedDataManager.updateDateBasedData();
        }
        
        // カスタムイベント発火（プロフィール体重更新用）
        window.dispatchEvent(new CustomEvent('weightUpdated', { 
          detail: { weight, date: dateKey } 
        }));
        
      } else {
        console.error('❌ 体重記録失敗');
        alert('体重記録に失敗しました');
      }
    } catch (error) {
      console.error('❌ 体重記録エラー:', error);
      alert('体重記録でエラーが発生しました');
    } finally {
      setIsRecording(false);
    }
  };

  // サーバーサイドでは何も表示しない
  if (!isClient) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center mb-8">体重表示比較テスト</h1>
        
        {/* 体重記録セクション */}
        <Card className="p-4">
          <h2 className="font-bold mb-3">体重記録テスト</h2>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="体重を入力 (kg)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRecording}
            />
            <button
              onClick={handleWeightRecord}
              disabled={!weightInput || isRecording}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isRecording ? '記録中...' : '記録'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            選択日: {(navigation?.selectedDate || new Date()).toLocaleDateString('ja-JP')}
          </div>
        </Card>

        {/* デバッグ情報 */}
        <Card className="p-4">
          <h2 className="font-bold mb-2">デバッグ情報</h2>
          <div className="text-sm space-y-1">
            <div>useWeightData.current: {weightManager?.weightData?.current || 'null'}</div>
            <div>useWeightData.previous: {weightManager?.weightData?.previous || 'null'}</div>
            <div>useWeightData.target: {weightManager?.weightData?.target || 'null'}</div>
            <div>sharedProfile.weight: {sharedProfile?.latestProfile?.weight || 'null'}</div>
            <div>counseling.weight: {counselingResult?.answers?.weight || 'null'}</div>
            <div>counseling.targetWeight: {counselingResult?.answers?.targetWeight || 'null'}</div>
            <div>isLoading: {weightManager?.isLoadingWeightData ? 'true' : 'false'}</div>
            <div>選択日: {(navigation?.selectedDate || new Date()).toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })}</div>
          </div>
        </Card>

        {/* 現在のWeightCard（遅い版） */}
        <div>
          <h2 className="font-bold mb-2 text-red-600">現在版（遅い）</h2>
          {weightManager && (
            <WeightCard
              data={weightManager.weightData}
              counselingResult={counselingResult}
              selectedDate={navigation?.selectedDate}
              onNavigateToWeight={() => {}}
            />
          )}
        </div>

        {/* 修正版WeightCard（速い版） */}
        <div>
          <h2 className="font-bold mb-2 text-green-600">修正版（速い）</h2>
          {weightManager && (
            <WeightCardFast
              data={weightManager.weightData}
              counselingResult={counselingResult}
              selectedDate={navigation?.selectedDate}
              sharedProfile={sharedProfile}
              onNavigateToWeight={() => {}}
            />
          )}
        </div>

        <div className="text-center">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    </div>
  );
}