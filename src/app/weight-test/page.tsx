'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeightChart } from '@/components/WeightChart';
import { ArrowLeft, Plus, Trash2, Download, Upload } from 'lucide-react';

interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
  note?: string;
}

export default function WeightTestPage() {
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [period, setPeriod] = useState<'week' | 'month' | '6months' | 'year'>('month');

  // ローカルストレージから読み込み
  useEffect(() => {
    const saved = localStorage.getItem('weight-test-data');
    if (saved) {
      try {
        setWeightData(JSON.parse(saved));
      } catch (e) {
        console.error('データの読み込みに失敗:', e);
      }
    }
  }, []);

  // データ保存
  const saveData = (data: WeightEntry[]) => {
    setWeightData(data);
    localStorage.setItem('weight-test-data', JSON.stringify(data));
  };

  // 体重記録追加
  const addWeightEntry = () => {
    if (!weight || isNaN(Number(weight))) {
      alert('有効な体重を入力してください');
      return;
    }

    const newEntry: WeightEntry = {
      date: selectedDate,
      weight: Number(weight),
      note: note || undefined
    };

    // 既存の日付があれば上書き、なければ追加
    const newData = weightData.filter(entry => entry.date !== selectedDate);
    newData.push(newEntry);
    newData.sort((a, b) => a.date.localeCompare(b.date));

    saveData(newData);
    setWeight('');
    setNote('');
  };

  // エントリ削除
  const deleteEntry = (date: string) => {
    if (confirm(`${date}の記録を削除しますか？`)) {
      const newData = weightData.filter(entry => entry.date !== date);
      saveData(newData);
    }
  };

  // サンプルデータ生成
  const generateSampleData = () => {
    const samples: WeightEntry[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 30日前から

    let currentWeight = 72; // 開始体重

    for (let i = 0; i < 31; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // ランダムな変動 (-0.5kg ~ +0.5kg)
      const variation = (Math.random() - 0.5) * 1;
      currentWeight += variation * 0.3; // 緩やかな変動
      
      // 全体的な減少トレンド
      currentWeight -= 0.02;
      
      samples.push({
        date: date.toISOString().split('T')[0],
        weight: Math.round(currentWeight * 10) / 10, // 小数点1桁
        note: i % 7 === 0 ? '計測日' : undefined
      });
    }

    saveData(samples);
  };

  // データエクスポート
  const exportData = () => {
    const dataStr = JSON.stringify(weightData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weight-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // データインポート
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          saveData(imported);
          alert('データをインポートしました');
        } else {
          alert('無効なデータ形式です');
        }
      } catch (e) {
        alert('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  // 全削除
  const clearAllData = () => {
    if (confirm('全ての体重データを削除しますか？この操作は取り消せません。')) {
      saveData([]);
    }
  };

  const targetWeight = 68;
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : 72;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* ヘッダー */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>戻る</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">体重グラフテスト</h1>
          </div>
          <div className="text-sm text-gray-600">
            データ数: {weightData.length}件
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: グラフ表示 */}
        <div className="lg:col-span-2">
          <WeightChart
            data={weightData}
            period={period}
            height={170} // 身長（cm）
            targetWeight={targetWeight}
            currentWeight={currentWeight}
          />
        </div>

        {/* 右側: 入力フォーム */}
        <div className="space-y-6">
          {/* データ追加 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Plus size={20} className="mr-2" />
              体重記録
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">日付</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="例: 70.5"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">メモ (任意)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例: 朝食前"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <Button onClick={addWeightEntry} className="w-full">
                記録追加
              </Button>
            </div>
          </Card>

          {/* ツール */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">テストツール</h3>
            
            <div className="space-y-3">
              <Button 
                onClick={generateSampleData} 
                variant="outline" 
                className="w-full"
              >
                サンプルデータ生成 (30日分)
              </Button>
              
              <Button 
                onClick={exportData} 
                variant="outline" 
                className="w-full"
                disabled={weightData.length === 0}
              >
                <Download size={16} className="mr-2" />
                データエクスポート
              </Button>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  id="import-file"
                />
                <Button 
                  onClick={() => document.getElementById('import-file')?.click()}
                  variant="outline" 
                  className="w-full"
                >
                  <Upload size={16} className="mr-2" />
                  データインポート
                </Button>
              </div>
              
              <Button 
                onClick={clearAllData} 
                variant="destructive" 
                className="w-full"
                disabled={weightData.length === 0}
              >
                <Trash2 size={16} className="mr-2" />
                全データ削除
              </Button>
            </div>
          </Card>

          {/* データ一覧 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">記録一覧</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {weightData.slice().reverse().map((entry) => (
                <div 
                  key={entry.date} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{entry.date}</div>
                    <div className="text-sm text-gray-600">
                      {entry.weight}kg
                      {entry.note && ` - ${entry.note}`}
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteEntry(entry.date)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              
              {weightData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  まだ記録がありません
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}