import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '@/lib/utils';
import { apiCache, createCacheKey } from '@/lib/cache';
// import { useLatestProfile } from './useProfileHistory'; // 🔄 統合により削除

interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  weight: number;
  note?: string;
  photo?: string;
  time: string; // HH:MM format
  timestamp: number;
}

interface WeightData {
  current: number;
  previous: number;
  target: number;
}

interface WeightSettings {
  targetWeight: number;
  goalDeadline?: string;
  weightUnit: 'kg' | 'lbs';
  reminderTime?: string;
  reminderEnabled: boolean;
}

export function useWeightData(selectedDate: Date, dateBasedData: any, updateDateData: (updates: any) => void, counselingResult?: any, sharedProfile?: { latestProfile: any; getProfileForDate: (date: Date) => any }) {
  const { liffUser } = useAuth();
  const latestProfile = sharedProfile?.latestProfile; // 🔄 統合プロフィールから取得
  
  // モーダル状態管理
  const [isWeightEntryModalOpen, setIsWeightEntryModalOpen] = useState(false);
  const [isWeightSettingsModalOpen, setIsWeightSettingsModalOpen] = useState(false);
  
  // 実データ取得用のstate
  const [realWeightData, setRealWeightData] = useState<Array<{date: string; weight: number}>>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingWeightData, setIsLoadingWeightData] = useState(true);
  
  // クライアントサイドでのマウントを確認
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Firestoreから体重データを取得（月データを一度取得して使い回し）
  useEffect(() => {
    if (!isClient) return;
    
    const fetchWeightData = async () => {
      const lineUserId = liffUser?.userId;
      if (!lineUserId) {
        // 🔧 ユーザーIDがない場合もローディング終了
        setIsLoadingWeightData(false);
        console.log('⚠️ lineUserIdなし：体重データローディング終了');
        return;
      }
      
      // キャッシュキー生成（月単位）
      const cacheKey = createCacheKey('weight', lineUserId, 'month');
      
      // キャッシュチェック
      const cachedData = apiCache.get(cacheKey);
      
      // 今日の日付判定
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      const selectedKey = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      const isTodaySelected = selectedKey === today;
      
      // キャッシュがあれば常に即座に表示（アプリ起動時の高速化）
      if (cachedData) {
        console.log('⚡ 体重データをキャッシュから即座に取得');
        setRealWeightData(cachedData);
        setIsLoadingWeightData(false);
        
        // キャッシュから取得完了（バックグラウンド取得削除でAPI半減）
        return;
      } else {
        console.log('🔄 キャッシュなし：API取得');
      }
      
      try {
        console.log('🔄 体重データをAPIから取得');
        const response = await fetch(`/api/weight?lineUserId=${lineUserId}&period=month`);
        if (response.ok) {
          const result = await response.json();
          const weightData = result.data || [];
          
          // キャッシュに保存（5分間有効）
          apiCache.set(cacheKey, weightData, 5 * 60 * 1000);
          
          // 今日の場合、既にキャッシュデータを表示済みなら、差分がある場合のみ更新
          if (isTodaySelected && cachedData) {
            const hasChanges = JSON.stringify(cachedData) !== JSON.stringify(weightData);
            if (hasChanges) {
              console.log('🔄 最新データに差分があるため更新');
              setRealWeightData(weightData);
            } else {
              console.log('✅ キャッシュと最新データが同じため更新不要');
            }
          } else {
            // キャッシュがない場合や過去日付の場合は通常通り更新
            setRealWeightData(weightData);
          }
          
          // APIから取得したデータと重複するローカルデータを削除
          const currentDateData = dateBasedData[selectedKey];
          const hasLocalDataForToday = currentDateData?.weightEntries && currentDateData.weightEntries.length > 0;
          if (hasLocalDataForToday && weightData.length > 0) {
            const todayApiData = weightData.find(item => item.date === selectedKey);
            if (todayApiData) {
              // 今日のローカルエントリを削除（APIデータがあるため）
              updateDateData({
                weightEntries: []
              });
              console.log('🔄 APIデータと重複するローカル体重記録を削除');
            }
          }
        }
      } catch (error) {
        console.error('体重データ取得エラー:', error);
      } finally {
        setIsLoadingWeightData(false);
      }
    };

    fetchWeightData();
  }, [liffUser?.userId, isClient]); // selectedDateを依存関係から除去（月データ使い回しのため）
  
  // 今日の日付が選択された場合のみ最新データチェック
  useEffect(() => {
    if (!isClient || !liffUser?.userId) return;
    
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const selectedKey = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const isTodaySelected = selectedKey === today;
    
    if (isTodaySelected) {
      const cacheKey = createCacheKey('weight', liffUser.userId, 'month');
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData) {
        console.log('📅 今日の日付選択：キャッシュから即座に表示');
        setRealWeightData(cachedData);
        setIsLoadingWeightData(false);
        
        // キャッシュから即座表示（バックグラウンド取得削除）
      }
    }
  }, [selectedDate, liffUser?.userId, isClient]); // 今日選択時のみの軽量チェック
  
  // 体重設定をlocalStorageで永続化
  const weightSettingsStorage = useLocalStorage<WeightSettings>('healthApp_weightSettings', {
    targetWeight: 0,
    goalDeadline: undefined,
    weightUnit: 'kg',
    reminderTime: '07:00',
    reminderEnabled: true,
  });

  // 現在選択されている日付のデータを取得
  const getCurrentDateData = () => {
    const dateKey = getDateKey(selectedDate);
    return dateBasedData[dateKey] || { weightData: { current: 0, previous: 0, target: 0 } };
  };

  // 日付のキーを生成（日本時間基準で統一）
  const getDateKey = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  };


  // カウンセリング日かどうかをチェック
  const isCounselingDate = (checkDate: Date): boolean => {
    if (!counselingResult) return false;
    const counselingDateRaw = counselingResult.firstCompletedAt || 
                             counselingResult.createdAt || 
                             counselingResult.completedAt;
    if (!counselingDateRaw) return false;
    const counselingDate = new Date(counselingDateRaw);
    return checkDate.toDateString() === counselingDate.toDateString();
  };

  // 特定の日付の体重データを取得（高速化済み）
  const getWeightDataForDate = (date: Date): WeightData => {
    // クライアントサイドでない場合はデフォルト値を返す
    if (!isClient) {
      return {
        current: 0,
        previous: 0,
        target: weightSettingsStorage.value.targetWeight || 68.0
      };
    }
    
    const dateKey = getDateKey(date);
    const today = getDateKey(new Date());
    
    // 未来の日付の場合は体重を表示しない
    if (dateKey > today) {
      return {
        current: 0,
        previous: 0,
        target: weightSettingsStorage.value.targetWeight || 68.0
      };
    }
    
    // 目標体重を設定（健康維持モード判定）
    const isMaintenanceMode = counselingResult?.answers?.primaryGoal === 'maintenance';
    const targetWeight = (isMaintenanceMode ? 0 : 
                         latestProfile?.targetWeight || 
                         counselingResult?.answers?.targetWeight) || 
                        weightSettingsStorage.value.targetWeight || 0;
    
    // 🚀 高速化：APIデータを優先し、複雑なフォールバック削除
    const currentDayData = realWeightData.find(item => item.date === dateKey);
    const currentWeight = currentDayData?.weight || 0;
    
    // 前日の体重記録を取得（前日比計算用）
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousKey = getDateKey(previousDate);
    const previousDayData = realWeightData.find(item => item.date === previousKey);
    const previousWeight = previousDayData?.weight || 0;
    
    return {
      current: currentWeight, // 記録がない場合は0（WeightCardで--表示）
      previous: previousWeight, // 前日記録がない場合は0（WeightCardで--表示）
      target: targetWeight
    };
  };

  // 最新の体重を取得（高速化済み）
  const getLatestWeight = (): number => {
    // 🚀 高速化：realWeightDataのみから最新体重を取得
    if (realWeightData.length > 0) {
      const sortedData = realWeightData
        .filter(item => item.weight && item.weight > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (sortedData.length > 0) {
        return sortedData[0].weight;
      }
    }
    
    return 0; // 記録がない場合は0
  };

  // 前日の体重を取得（その日の実際の記録を正確に取得）
  const getPreviousWeight = (date: Date): number => {
    const dateKey = getDateKey(date);
    
    // 指定された日付の実際の記録を取得（realWeightDataから）
    const realDataForDate = realWeightData.find(item => item.date === dateKey);
    if (realDataForDate && realDataForDate.weight > 0) {
      return realDataForDate.weight;
    }
    
    // fallback: ローカルデータから確認
    const dayData = dateBasedData[dateKey];
    
    if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
      return dayData.weightEntries[dayData.weightEntries.length - 1].weight;
    }
    
    // その日に記録がない場合は0を返す（前日比を表示しない）
    return 0;
  };

  // 体重記録を追加
  const handleAddWeightEntry = async (data: { weight?: number; note?: string; photo?: string }) => {
    const lineUserId = liffUser?.userId;
    const dateStr = getDateKey(selectedDate);
    
    try {
      // APIに送信（体重と体脂肪のどちらかまたは両方）
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId,
          date: dateStr,
          weight: data.weight,
          note: data.note
        }),
      });

      if (!response.ok) {
        throw new Error('記録の保存に失敗しました');
      }

      // ローカル保存はせず、APIが真実の源となる

      // realWeightDataも即座に更新（体重が記録された場合）
      if (data.weight) {
        const newRealWeightEntry = {
          date: dateStr,
          weight: data.weight || 0
        };
        
        setRealWeightData(prevData => {
          // 既存の同じ日付のデータを削除して新しいデータを追加
          const filteredData = prevData.filter(item => item.date !== dateStr);
          const updatedData = [...filteredData, newRealWeightEntry].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          
          // キャッシュも同時に更新（重要：削除ではなく更新）
          const cacheKey = createCacheKey('weight', lineUserId, 'month');
          apiCache.set(cacheKey, updatedData, 5 * 60 * 1000);
          console.log('⚡ 体重記録後：キャッシュも即座に更新');
          
          return updatedData;
        });
        
        // 🔄 プロフィールの体重も自動更新するためイベント発火
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('weightDataUpdated', {
            detail: { weight: data.weight, date: dateStr }
          }));
          console.log('🔄 体重記録→プロフィール自動更新イベント発火');
        }
        
        // UI即座反映のため強制的にローディング状態をリセット
        setIsLoadingWeightData(false);
        console.log('🔄 アプリ記録後に体重キャッシュを強制更新&UI即座反映');
      }

      console.log('記録が正常に保存されました');
    } catch (error) {
      console.error('記録保存エラー:', error);
      alert('記録の保存に失敗しました。もう一度お試しください。');
    }
  };

  // 体重記録を更新
  const handleUpdateWeightEntry = (entryId: string, updates: Partial<WeightEntry>) => {
    const currentData = getCurrentDateData();
    const updatedEntries = (currentData.weightEntries || []).map((entry: WeightEntry) =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    );
    
    updateDateData({
      weightEntries: updatedEntries
    });
  };

  // 体重記録を削除
  const handleDeleteWeightEntry = (entryId: string) => {
    const currentData = getCurrentDateData();
    const filteredEntries = (currentData.weightEntries || []).filter((entry: WeightEntry) => entry.id !== entryId);
    
    updateDateData({
      weightEntries: filteredEntries
    });
  };

  // 目標体重を設定（localStorage自動保存）
  const handleUpdateWeightSettings = (newSettings: Partial<WeightSettings>) => {
    const updatedSettings = { ...weightSettingsStorage.value, ...newSettings };
    weightSettingsStorage.setValue(updatedSettings);
    
    // 過去の記録は変更せず、設定のみ更新（表示時に動的計算）
    
    // キャッシュをクリアして最新データを再取得
    if (liffUser?.userId) {
      const cacheKey = createCacheKey('weight', liffUser.userId, 'month');
      apiCache.delete(cacheKey);
      
      // 最新データを即座に再取得
      const fetchWeightData = async () => {
        try {
          const response = await fetch(`/api/weight?lineUserId=${liffUser.userId}&period=month`);
          if (response.ok) {
            const result = await response.json();
            const weightData = result.data || [];
            
            // キャッシュに保存（5分間有効）
            apiCache.set(cacheKey, weightData, 5 * 60 * 1000);
            setRealWeightData(weightData);
          }
        } catch (error) {
          console.error('体重データ再取得エラー:', error);
        }
      };
      
      fetchWeightData();
    }
  };



  return {
    // データ
    weightData: getWeightDataForDate(selectedDate),
    weightSettings: weightSettingsStorage.value,
    realWeightData, // 実データを追加
    isLoadingWeightData, // ローディング状態を追加
    
    // モーダル状態
    isWeightEntryModalOpen,
    isWeightSettingsModalOpen,
    
    // アクション
    handleAddWeightEntry,
    handleUpdateWeightEntry,
    handleDeleteWeightEntry,
    handleUpdateWeightSettings,
    
    // モーダル制御
    setIsWeightEntryModalOpen,
    setIsWeightSettingsModalOpen,
    
    // ユーティリティ
    getWeightDataForDate
  };
}