'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WeightChart } from '@/components/WeightChart';

interface WeightEntry {
  date: string;
  weight: number;
  bodyFat?: number;
  waist?: number;
  morningWeight?: number;
  eveningWeight?: number;
  note?: string;
}

export default function DevWeightPage() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: 70,
    bodyFat: 20,
    waist: 80,
    note: ''
  });

  const addWeightEntry = () => {
    if (newEntry.date && newEntry.weight > 0) {
      const entry: WeightEntry = {
        date: newEntry.date,
        weight: newEntry.weight,
        bodyFat: newEntry.bodyFat || undefined,
        waist: newEntry.waist || undefined,
        note: newEntry.note || undefined
      };
      
      setWeightEntries(prev => {
        const updated = [...prev, entry].sort((a, b) => a.date.localeCompare(b.date));
        return updated;
      });
      
      // 次の日付を自動設定
      const nextDate = new Date(newEntry.date);
      nextDate.setDate(nextDate.getDate() + 1);
      setNewEntry(prev => ({
        ...prev,
        date: nextDate.toISOString().split('T')[0]
      }));
    }
  };

  const clearAllEntries = () => {
    setWeightEntries([]);
  };

  // ダミーデータを追加する関数（61日分）
  const addSampleData = () => {
    const today = new Date();
    const sampleEntries: WeightEntry[] = [];
    
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // 体重の変動をシミュレート（70kg基準で±3kgの範囲）
      const baseWeight = 70;
      const variation = Math.sin(i / 10) * 2 + Math.random() * 1 - 0.5;
      const weight = Math.round((baseWeight + variation) * 10) / 10;
      
      const bodyFat = Math.round((20 + Math.random() * 4 - 2) * 10) / 10;
      const waist = Math.round(80 + Math.random() * 6 - 3);
      
      sampleEntries.push({
        date: date.toISOString().split('T')[0],
        weight,
        bodyFat,
        waist,
        note: i === 0 ? '今日' : ''
      });
    }
    
    setWeightEntries(sampleEntries);
  };

  // 一年分のダミーデータを追加する関数（365日分）
  const addYearSampleData = () => {
    const today = new Date();
    const sampleEntries: WeightEntry[] = [];
    
    for (let i = -365; i <= 0; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // より長期的な体重変動をシミュレート
      const baseWeight = 72;
      
      // 長期トレンド（年間で-2kgの減量）
      const longTermTrend = (i + 365) / 365 * (-2);
      
      // 季節的変動（冬に少し増加、夏に減少）
      const monthFactor = Math.sin((i + 365) / 365 * 2 * Math.PI + Math.PI) * 1.5;
      
      // 短期的変動
      const shortTermVariation = Math.sin(i / 7) * 0.5 + Math.random() * 1 - 0.5;
      
      const weight = Math.round((baseWeight + longTermTrend + monthFactor + shortTermVariation) * 10) / 10;
      
      const bodyFat = Math.round((22 + Math.random() * 6 - 3) * 10) / 10;
      const waist = Math.round(82 + Math.random() * 8 - 4);
      
      sampleEntries.push({
        date: date.toISOString().split('T')[0],
        weight,
        bodyFat,
        waist,
        note: i === 0 ? '今日' : (i === -365 ? '1年前' : '')
      });
    }
    
    setWeightEntries(sampleEntries);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 体重グラフ開発環境</h1>
          <p className="text-gray-600">体重データを入力して、グラフの表示をテストできます</p>
        </div>

        {/* データ入力エリア */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">📝 データ入力</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={newEntry.weight}
                onChange={(e) => setNewEntry(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                placeholder="70.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">体脂肪率 (%)</label>
              <Input
                type="number"
                step="0.1"
                value={newEntry.bodyFat}
                onChange={(e) => setNewEntry(prev => ({ ...prev, bodyFat: parseFloat(e.target.value) || 0 }))}
                placeholder="20.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ウエスト (cm)</label>
              <Input
                type="number"
                value={newEntry.waist}
                onChange={(e) => setNewEntry(prev => ({ ...prev, waist: parseInt(e.target.value) || 0 }))}
                placeholder="80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
              <Input
                type="text"
                value={newEntry.note}
                onChange={(e) => setNewEntry(prev => ({ ...prev, note: e.target.value }))}
                placeholder="メモ"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={addWeightEntry} className="bg-blue-600 hover:bg-blue-700">
              データ追加
            </Button>
            <Button onClick={addSampleData} variant="outline">
              サンプルデータ追加 (61日分)
            </Button>
            <Button onClick={addYearSampleData} variant="outline" className="bg-green-50 hover:bg-green-100">
              1年分データ追加 (365日分)
            </Button>
            <Button onClick={clearAllEntries} variant="outline" className="text-red-600">
              全削除
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            現在のデータ数: {weightEntries.length}件
          </div>
        </Card>

        {/* 体重グラフ */}
        <Card className="p-6">
          <WeightChart
            data={weightEntries}
            period="month"
            height={170}
            targetWeight={68.0}
            currentWeight={weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : 70}
            counselingResult={{
              answers: {
                weight: 70,
                targetWeight: 68
              }
            }}
          />
        </Card>

        {/* データ一覧 */}
        {weightEntries.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">📋 入力データ一覧</h2>
            <div className="max-h-64 overflow-y-auto">
              <div className="grid gap-2 text-sm">
                {weightEntries.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{entry.date}</span>
                    <span>{entry.weight}kg</span>
                    {entry.bodyFat && <span>{entry.bodyFat}%</span>}
                    {entry.waist && <span>{entry.waist}cm</span>}
                    {entry.note && <span className="text-gray-600">"{entry.note}"</span>}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}