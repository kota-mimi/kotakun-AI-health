'use client';

import React, { useState } from 'react';
import { apiCache } from '@/lib/cache';
import { useMealData } from '@/hooks/useMealData';
import { useCounselingData } from '@/hooks/useCounselingData';
import { useWeightData } from '@/hooks/useWeightData';
import { useExerciseData } from '@/hooks/useExerciseData';

// モックデータ用
const mockDateBasedData = {};
const mockUpdateDateData = () => {};

export default function TestHooksPage() {
  const [result, setResult] = useState<string>('');
  const [isTestRunning, setIsTestRunning] = useState(false);

  // テスト用の日付
  const testDate = new Date('2025-01-06');

  // Hooksをテスト
  const counselingHook = useCounselingData();
  const mealHook = useMealData(testDate, mockDateBasedData, mockUpdateDateData, counselingHook.counselingResult);
  const weightHook = useWeightData(testDate, mockDateBasedData, mockUpdateDateData, counselingHook.counselingResult);
  const exerciseHook = useExerciseData(testDate, mockDateBasedData, mockUpdateDateData);

  const testAllHooks = async () => {
    setIsTestRunning(true);
    setResult('テスト実行中...');
    
    try {
      // キャッシュ統計取得
      const stats = apiCache.getStats();
      
      const results = [];
      results.push('=== Hooks テスト結果 ===');
      results.push(`日付: ${testDate.toISOString().split('T')[0]}`);
      results.push('');
      
      // 各hookの状態確認
      results.push('📊 Hooks 状態:');
      results.push(`- useCounselingData: ${counselingHook.isLoading ? '読み込み中' : '完了'}`);
      results.push(`- useMealData: ${mealHook.isLoading ? '読み込み中' : '完了'}`);
      results.push(`- useWeightData: 体重データ数 ${weightHook.realWeightData?.length || 0}`);
      results.push(`- useExerciseData: 運動データ数 ${exerciseHook.exerciseData?.length || 0}`);
      results.push('');
      
      // キャッシュ統計
      results.push('🎯 キャッシュ統計:');
      results.push(`- キャッシュ数: ${stats.size}`);
      results.push(`- キャッシュキー: ${stats.keys.join(', ')}`);
      results.push('');
      
      // カウンセリング結果
      if (counselingHook.counselingResult) {
        results.push('💬 カウンセリング結果:');
        results.push(`- データあり: ✅`);
        results.push(`- カロリー目標: ${counselingHook.counselingResult.aiAnalysis?.nutritionPlan?.dailyCalories || 'なし'}`);
      } else {
        results.push('💬 カウンセリング結果: データなし');
      }
      results.push('');
      
      // 食事データ
      if (mealHook.mealData) {
        const totalMeals = Object.values(mealHook.mealData).flat().length;
        results.push('🍽️ 食事データ:');
        results.push(`- 総食事数: ${totalMeals}`);
        results.push(`- 朝食: ${mealHook.mealData.breakfast?.length || 0}`);
        results.push(`- 昼食: ${mealHook.mealData.lunch?.length || 0}`);
        results.push(`- 夕食: ${mealHook.mealData.dinner?.length || 0}`);
        results.push(`- 間食: ${mealHook.mealData.snack?.length || 0}`);
      }
      
      setResult(results.join('\n'));
      
    } catch (error) {
      console.error('テストエラー:', error);
      setResult(`❌ テストエラー: ${error.message}`);
    } finally {
      setIsTestRunning(false);
    }
  };

  const clearCache = () => {
    apiCache.clear();
    setResult('🧹 キャッシュをクリアしました');
    console.log('🧹 キャッシュクリア完了');
  };

  const forceRefresh = async () => {
    setResult('🔄 強制リフレッシュ中...');
    try {
      await counselingHook.refetch?.();
      setResult('✅ 強制リフレッシュ完了');
    } catch (error) {
      setResult(`❌ リフレッシュエラー: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Hooks & キャッシュテスト</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">テスト実行</h2>
          <div className="space-x-4">
            <button
              onClick={testAllHooks}
              disabled={isTestRunning}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isTestRunning ? '実行中...' : '全Hooksテスト'}
            </button>
            
            <button
              onClick={clearCache}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              キャッシュクリア
            </button>
            
            <button
              onClick={forceRefresh}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              強制リフレッシュ
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">テスト結果</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto h-64 whitespace-pre-wrap">
            {result || 'テストを実行してください'}
          </pre>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">リアルタイム状態</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold text-blue-800">カウンセリング</h3>
              <p className="text-sm">
                状態: {counselingHook.isLoading ? '🔄 読み込み中' : '✅ 完了'}
              </p>
              <p className="text-sm">
                データ: {counselingHook.counselingResult ? '✅ あり' : '❌ なし'}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold text-green-800">食事</h3>
              <p className="text-sm">
                状態: {mealHook.isLoading ? '🔄 読み込み中' : '✅ 完了'}
              </p>
              <p className="text-sm">
                データ: {mealHook.mealData ? Object.values(mealHook.mealData).flat().length : 0} 件
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-semibold text-purple-800">体重</h3>
              <p className="text-sm">
                データ: {weightHook.realWeightData?.length || 0} 件
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded">
              <h3 className="font-semibold text-orange-800">運動</h3>
              <p className="text-sm">
                データ: {exerciseHook.exerciseData?.length || 0} 件
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">使い方</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>F12でDevToolsを開く</li>
            <li>Consoleタブを確認</li>
            <li>「全Hooksテスト」をクリック</li>
            <li>コンソールログとこの画面の結果を確認</li>
            <li>キャッシュヒット/ミスのログを確認</li>
          </ol>
        </div>
      </div>
    </div>
  );
}