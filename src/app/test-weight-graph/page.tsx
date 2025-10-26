'use client';

import { useState } from 'react';
import { WeightChart } from '@/components/WeightChart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// サンプルデータを生成する関数
const generateSampleData = (days: number, startWeight: number = 70) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // ランダムな体重変動（±2kg程度）
    const randomVariation = (Math.random() - 0.5) * 4;
    const trendChange = -i * 0.02; // 徐々に減る傾向
    const weight = Math.round((startWeight + randomVariation + trendChange) * 10) / 10;
    
    data.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD形式
      weight: Math.max(50, Math.min(100, weight)), // 50-100kgの範囲
      waist: 80 + Math.random() * 10, // 仮の値
    });
  }
  
  return data;
};

// プリセットデータ
const presetData = {
  week: generateSampleData(7, 72),
  month: generateSampleData(30, 72), 
  threeMonths: generateSampleData(90, 75),
  sixMonths: generateSampleData(180, 78),
  year: generateSampleData(365, 80),
};

// カウンセリング結果のサンプル
const sampleCounselingResult = {
  answers: {
    name: 'テストユーザー',
    age: 30,
    gender: 'male',
    height: 170,
    weight: 72,
    targetWeight: 68,
    activityLevel: 'moderate',
    primaryGoal: 'weight_loss'
  },
  createdAt: new Date().toISOString(),
};

export default function TestWeightGraphPage() {
  const [selectedDataSet, setSelectedDataSet] = useState<keyof typeof presetData>('month');
  const [targetWeight, setTargetWeight] = useState(68);
  const [currentWeight, setCurrentWeight] = useState(72);

  const currentData = presetData[selectedDataSet];

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">体重グラフテストページ</h1>
        
        {/* コントロールパネル */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">テスト設定</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                データセット
              </label>
              <select 
                value={selectedDataSet}
                onChange={(e) => setSelectedDataSet(e.target.value as keyof typeof presetData)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="week">1週間分（7日）</option>
                <option value="month">1ヶ月分（30日）</option>
                <option value="threeMonths">3ヶ月分（90日）</option>
                <option value="sixMonths">6ヶ月分（180日）</option>
                <option value="year">1年分（365日）</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標体重 (kg)
              </label>
              <Input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                現在の体重 (kg)
              </label>
              <Input
                type="number"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                // データを再生成
                const newData = generateSampleData(
                  selectedDataSet === 'week' ? 7 :
                  selectedDataSet === 'month' ? 30 :
                  selectedDataSet === 'threeMonths' ? 90 :
                  selectedDataSet === 'sixMonths' ? 180 : 365,
                  currentWeight
                );
                presetData[selectedDataSet] = newData;
                // 強制再レンダリング
                setSelectedDataSet(selectedDataSet);
              }}
            >
              データを再生成
            </Button>
          </div>
        </Card>
        
        {/* データ情報 */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-2">現在のデータ情報</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">データ数: </span>
              <span className="font-medium">{currentData.length}件</span>
            </div>
            <div>
              <span className="text-gray-600">期間: </span>
              <span className="font-medium">
                {currentData[0]?.date} 〜 {currentData[currentData.length - 1]?.date}
              </span>
            </div>
            <div>
              <span className="text-gray-600">最新体重: </span>
              <span className="font-medium">{currentData[currentData.length - 1]?.weight}kg</span>
            </div>
            <div>
              <span className="text-gray-600">目標体重: </span>
              <span className="font-medium">{targetWeight}kg</span>
            </div>
          </div>
        </Card>
        
        {/* 体重グラフ */}
        <WeightChart
          data={currentData}
          period="month"
          height={200}
          targetWeight={targetWeight}
          currentWeight={currentWeight}
          counselingResult={sampleCounselingResult}
        />
        
        {/* 使用方法 */}
        <Card className="p-6 mt-6">
          <h3 className="font-semibold mb-3">使用方法</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 上部のコントロールパネルでデータセットを変更できます</li>
            <li>• グラフ内の期間選択ボタン（1ヶ月、3ヶ月、全期間）で表示期間を切り替えられます</li>
            <li>• グラフ上をマウスオーバーまたはタッチすると詳細な値が表示されます</li>
            <li>• 「データを再生成」ボタンで新しいランダムデータを生成します</li>
            <li>• 目標体重と現在の体重を変更してグラフの見た目を調整できます</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}