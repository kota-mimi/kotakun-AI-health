import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { apiCache, createCacheKey } from '@/lib/cache';

interface CounselingResult {
  aiAnalysis: {
    personalizedAdvice: {
      advice: string;
    };
    nutritionPlan: {
      dailyCalories: number;
      macros: {
        protein: number;
        carbs: number;
        fat: number;
      };
    };
    riskFactors: Array<{
      type: string;
      message: string;
    }>;
    recommendations: Array<{
      category: string;
      title: string;
      items: string[];
    }>;
  };
  answers: {
    targetWeight: number;
    targetDate: string;
    primaryGoal: string;
  };
  userProfile?: {
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    targetWeight: number;
  };
}

export function useCounselingData() {
  const { liffUser } = useAuth();
  
  const lineUserId = liffUser?.userId;
  
  const [counselingResult, setCounselingResult] = useState<CounselingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffectを使用して、完全に安全にデータを取得
  React.useEffect(() => {
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (!lineUserId) {
          // lineUserIdがない場合はローカルストレージのみ
          if (typeof window !== 'undefined') {
            const localAnswers = localStorage.getItem('counselingAnswers');
            const localAnalysis = localStorage.getItem('aiAnalysis');
            
            
            if (localAnswers) {
              const answers = JSON.parse(localAnswers);
              
              // テストデータ「利光湖太郎」を検出して削除
              if (answers.name === '利光湖太郎') {
                localStorage.removeItem('counselingAnswers');
                localStorage.removeItem('aiAnalysis');
                setCounselingResult(null);
                setIsLoading(false);
                return;
              }
              
              const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
              
              
              setCounselingResult({
                answers,
                aiAnalysis: analysis,
                userProfile: answers
              });
            } else {
            }
          } else {
          }
          setIsLoading(false);
          return;
        }

        
        // まずローカルストレージをチェック（即座に表示）
        if (typeof window !== 'undefined') {
          const localAnswers = localStorage.getItem('counselingAnswers');
          const localAnalysis = localStorage.getItem('aiAnalysis');
          
          
          if (localAnswers) {
            const answers = JSON.parse(localAnswers);
            
            // テストデータ「利光湖太郎」を検出して削除
            if (answers.name === '利光湖太郎') {
              localStorage.removeItem('counselingAnswers');
              localStorage.removeItem('aiAnalysis');
              setCounselingResult(null);
              setIsLoading(false);
              return;
            }
            
            const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
            
            
            setCounselingResult({
              answers,
              aiAnalysis: analysis,
              userProfile: answers
            });
          } else {
          }
        }
        
        // 次にFirestoreから最新データを取得（バックグラウンド）
        try {
          // キャッシュキー生成
          const cacheKey = createCacheKey('counseling', lineUserId);
          
          // キャッシュチェック
          const cachedCounseling = apiCache.get(cacheKey);
          if (cachedCounseling) {
            setCounselingResult(cachedCounseling);
            setIsLoading(false);
            return;
          }
          
          const startTime = Date.now();
          
          const response = await fetch('/api/counseling/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId }),
          });

          const responseTime = Date.now() - startTime;

          if (response.ok) {
            const data = await response.json();
            
            if (data.counselingResult) {
              // Firestoreから取得したデータも「利光湖太郎」なら無視
              if (data.counselingResult.answers?.name === '利光湖太郎' || data.counselingResult.userProfile?.name === '利光湖太郎') {
                return;
              }
              
              // キャッシュに保存（10分間有効）
              apiCache.set(cacheKey, data.counselingResult, 10 * 60 * 1000);
              setCounselingResult(data.counselingResult);
            } else {
            }
          } else {
            const errorText = await response.text();
            // APIエラーでもローカルストレージデータがあれば問題なし
          }
        } catch (apiError) {
          console.error('🔥 [PRODUCTION] API fetch error (non-fatal):', {
            error: apiError,
            message: apiError.message,
            stack: apiError.stack
          });
          // APIエラーでもローカルストレージデータがあれば問題なし
        }
        
      } catch (error) {
        console.error('🔥 Fatal error in useCounselingData:', error);
        // 最悪でもnullでエラーにならない
        setCounselingResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [lineUserId]);
  

  // LocalStorageからのデータ取得専用関数
  const refetchLocal = () => {
    try {
      if (typeof window !== 'undefined') {
        const localAnswers = localStorage.getItem('counselingAnswers');
        const localAnalysis = localStorage.getItem('aiAnalysis');
        
        if (localAnswers) {
          const answers = JSON.parse(localAnswers);
          
          // テストデータ「利光湖太郎」を検出して削除
          if (answers.name === '利光湖太郎') {
            localStorage.removeItem('counselingAnswers');
            localStorage.removeItem('aiAnalysis');
            setCounselingResult(null);
            return;
          }
          
          const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
          
          
          setCounselingResult({
            answers,
            aiAnalysis: analysis,
            userProfile: answers
          });
        } else {
          setCounselingResult(null);
        }
      }
    } catch (error) {
      console.error('🔥 RefetchLocal error:', error);
    }
  };

  // LocalStorageの変更を監視して自動更新
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'counselingAnswers' || e.key === 'aiAnalysis') {
        // 少し遅延させてからrefetch（データの整合性を保つため）
        setTimeout(() => {
          refetchLocal();
        }, 100);
      }
    };

    const handleCustomRefresh = () => {
      refetchLocal();
    };

    // StorageEventとカスタムイベントを監視
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('counselingDataUpdated', handleCustomRefresh);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('counselingDataUpdated', handleCustomRefresh);
    };
  }, []);

  return {
    counselingResult,
    isLoading,
    refetch: async () => {
      try {
        setIsLoading(true);
        
        // まずローカルストレージから最新のデータを確認
        refetchLocal();

        // APIからも取得を試行（エラーでも無視）
        if (lineUserId) {
          try {
            const response = await fetch('/api/counseling/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lineUserId }),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.counselingResult) {
                // Firestoreから取得したデータも「利光湖太郎」なら無視
                if (data.counselingResult.answers?.name === '利光湖太郎' || data.counselingResult.userProfile?.name === '利光湖太郎') {
                  return;
                }
                setCounselingResult(data.counselingResult);
              }
            }
          } catch (apiError) {
            // エラーは無視、ローカルストレージデータを使用
          }
        }
      } catch (error) {
        console.error('🔥 Refetch fatal error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    refetchLocal, // LocalStorage専用のrefetch関数も公開
  };
}