import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiCache, createCacheKey, CACHE_TTL } from '@/lib/cache';

interface DashboardData {
  counseling: any;
  meals: any[];
  weight: any[];
  feedback: any[];
  fetchedAt: string;
}

export function useDashboardData(selectedDate: Date) {
  const { liffUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのマウントを確認
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 統合データ取得
  useEffect(() => {
    if (!isClient) return;
    
    const fetchDashboardData = async () => {
      const lineUserId = liffUser?.userId;
      if (!lineUserId) {
        setIsLoading(false);
        console.log('⚠️ lineUserIdなし：統合ダッシュボードデータ取得終了');
        return;
      }

      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        // キャッシュキー生成（日付ベース）
        const cacheKey = createCacheKey('dashboard', lineUserId, dateStr);
        
        // キャッシュチェック
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) {
          console.log('⚡ 統合ダッシュボードデータをキャッシュから取得');
          setData(cachedData);
          setIsLoading(false);
          return;
        }

        console.log('🚀 統合ダッシュボードデータをAPIから取得');
        setIsLoading(true);
        
        const response = await fetch(`/api/dashboard-data?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success) {
            const dashboardData = result.data;
            
            // キャッシュに保存（15分間有効 - 統合ダッシュボードデータ）
            apiCache.set(cacheKey, dashboardData, CACHE_TTL.DASHBOARD);
            setData(dashboardData);
            
            console.log('✅ 統合ダッシュボードデータ取得・キャッシュ保存完了');
          } else {
            throw new Error(result.error || 'データ取得失敗');
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
      } catch (err) {
        console.error('❌ 統合ダッシュボードデータ取得エラー:', err);
        setError(err instanceof Error ? err.message : 'データ取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [liffUser?.userId, selectedDate, isClient]);

  // データ更新関数（個別保存後にキャッシュクリア用）
  const invalidateCache = () => {
    if (!liffUser?.userId) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    const cacheKey = createCacheKey('dashboard', liffUser.userId, dateStr);
    apiCache.delete(cacheKey);
    
    console.log('🔄 統合ダッシュボードキャッシュを無効化');
  };

  // データ更新関数（楽観的更新用）
  const updateLocalData = (type: 'meals' | 'weight' | 'feedback', newData: any) => {
    if (!data) return;
    
    setData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [type]: Array.isArray(newData) ? newData : [...prev[type], newData]
      };
    });
    
    console.log(`🔄 ${type}データをローカル更新`);
  };

  return {
    // 統合データ
    dashboardData: data,
    
    // 個別データアクセス
    counselingData: data?.counseling || null,
    mealsData: data?.meals || [],
    weightData: data?.weight || [],
    feedbackData: data?.feedback || [],
    
    // 状態
    isLoading,
    error,
    
    // ユーティリティ
    invalidateCache,
    updateLocalData,
    
    // リフェッチ（緊急時用）
    refetch: () => {
      invalidateCache();
      // useEffectの依存関係でリフェッチが自動実行される
    }
  };
}