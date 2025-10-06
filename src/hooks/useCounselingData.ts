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
  console.log('🔥 useCounselingData hook - PRODUCTION VERSION WITH ENHANCED DEBUGGING');
  const { liffUser } = useAuth();
  
  const lineUserId = liffUser?.userId;
  console.log('🔥 [PRODUCTION] lineUserId:', lineUserId);
  console.log('🔥 [PRODUCTION] liffUser object:', liffUser);
  console.log('🔥 [PRODUCTION] Environment:', typeof window !== 'undefined' ? 'browser' : 'server');
  
  const [counselingResult, setCounselingResult] = useState<CounselingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffectを使用して、完全に安全にデータを取得
  React.useEffect(() => {
    console.log('🔥 [PRODUCTION] useEffect triggered - starting data fetch');
    console.log('🔥 [PRODUCTION] Current state:', { lineUserId, isLoading });
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('🔥 [PRODUCTION] Setting loading to true');
        
        if (!lineUserId) {
          console.log('🔥 [PRODUCTION] No lineUserId detected, falling back to localStorage');
          // lineUserIdがない場合はローカルストレージのみ
          if (typeof window !== 'undefined') {
            const localAnswers = localStorage.getItem('counselingAnswers');
            const localAnalysis = localStorage.getItem('aiAnalysis');
            
            console.log('🔥 [PRODUCTION] LocalStorage check:', {
              hasAnswers: !!localAnswers,
              hasAnalysis: !!localAnalysis,
              answersLength: localAnswers?.length || 0,
              analysisLength: localAnalysis?.length || 0
            });
            
            if (localAnswers) {
              console.log('🔥 [PRODUCTION] Found local counseling data (no lineUserId)');
              const answers = JSON.parse(localAnswers);
              
              // テストデータ「利光湖太郎」を検出して削除
              if (answers.name === '利光湖太郎') {
                console.log('🔥 [PRODUCTION] Detected test data "利光湖太郎", clearing localStorage');
                localStorage.removeItem('counselingAnswers');
                localStorage.removeItem('aiAnalysis');
                setCounselingResult(null);
                setIsLoading(false);
                return;
              }
              
              const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
              
              console.log('🔥 [PRODUCTION] Parsed local data:', {
                answersKeys: Object.keys(answers),
                hasAnalysis: !!analysis,
                analysisKeys: analysis ? Object.keys(analysis) : []
              });
              
              setCounselingResult({
                answers,
                aiAnalysis: analysis,
                userProfile: answers
              });
            } else {
              console.log('🔥 [PRODUCTION] No local counseling data found');
            }
          } else {
            console.log('🔥 [PRODUCTION] Window is undefined (server-side)');
          }
          setIsLoading(false);
          return;
        }

        console.log('🔥 [PRODUCTION] Making API call with lineUserId:', lineUserId);
        console.log('🔥 [PRODUCTION] API endpoint: /api/counseling/status');
        
        // まずローカルストレージをチェック（即座に表示）
        if (typeof window !== 'undefined') {
          const localAnswers = localStorage.getItem('counselingAnswers');
          const localAnalysis = localStorage.getItem('aiAnalysis');
          
          console.log('🔥 [PRODUCTION] Pre-API localStorage check:', {
            hasAnswers: !!localAnswers,
            hasAnalysis: !!localAnalysis
          });
          
          if (localAnswers) {
            console.log('🔥 [PRODUCTION] Setting localStorage data first for immediate display');
            const answers = JSON.parse(localAnswers);
            
            // テストデータ「利光湖太郎」を検出して削除
            if (answers.name === '利光湖太郎') {
              console.log('🔥 [PRODUCTION] Detected test data "利光湖太郎", clearing localStorage (pre-API)');
              localStorage.removeItem('counselingAnswers');
              localStorage.removeItem('aiAnalysis');
              setCounselingResult(null);
              setIsLoading(false);
              return;
            }
            
            const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
            
            console.log('🔥 [PRODUCTION] LocalStorage data structure:', {
              answers: {
                keys: Object.keys(answers),
                hasNutritionData: !!(answers.height && answers.weight),
                hasCalorieTarget: !!(analysis?.nutritionPlan?.dailyCalories)
              },
              analysis: {
                hasNutritionPlan: !!(analysis?.nutritionPlan),
                dailyCalories: analysis?.nutritionPlan?.dailyCalories,
                hasMacros: !!(analysis?.nutritionPlan?.macros)
              }
            });
            
            setCounselingResult({
              answers,
              aiAnalysis: analysis,
              userProfile: answers
            });
          } else {
            console.log('🔥 [PRODUCTION] No localStorage data for immediate display');
          }
        }
        
        // 次にFirestoreから最新データを取得（バックグラウンド）
        try {
          // キャッシュキー生成
          const cacheKey = createCacheKey('counseling', lineUserId);
          
          // キャッシュチェック
          const cachedCounseling = apiCache.get(cacheKey);
          if (cachedCounseling) {
            console.log('🎯 [PRODUCTION] カウンセリングデータをキャッシュから取得');
            setCounselingResult(cachedCounseling);
            setIsLoading(false);
            return;
          }
          
          console.log('🔥 [PRODUCTION] Starting Firestore API call...');
          const startTime = Date.now();
          
          const response = await fetch('/api/counseling/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId }),
          });

          const responseTime = Date.now() - startTime;
          console.log('🔥 [PRODUCTION] API response received:', {
            status: response.status,
            statusText: response.statusText,
            responseTime: `${responseTime}ms`,
            headers: Object.fromEntries(response.headers.entries())
          });

          if (response.ok) {
            const data = await response.json();
            console.log('🔥 [PRODUCTION] Firestore API SUCCESS! Raw data:', data);
            console.log('🔥 [PRODUCTION] Response structure:', {
              hasCounselingResult: !!data.counselingResult,
              hasAnswers: !!(data.counselingResult?.answers),
              hasAiAnalysis: !!(data.counselingResult?.aiAnalysis),
              hasNutritionPlan: !!(data.counselingResult?.aiAnalysis?.nutritionPlan),
              dailyCalories: data.counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories,
              macros: data.counselingResult?.aiAnalysis?.nutritionPlan?.macros
            });
            
            if (data.counselingResult) {
              // Firestoreから取得したデータも「利光湖太郎」なら無視
              if (data.counselingResult.answers?.name === '利光湖太郎' || data.counselingResult.userProfile?.name === '利光湖太郎') {
                console.log('🔥 [PRODUCTION] Ignoring test data "利光湖太郎" from Firestore');
                return;
              }
              
              // キャッシュに保存（10分間有効）
              apiCache.set(cacheKey, data.counselingResult, 10 * 60 * 1000);
              console.log('✅ カウンセリング結果をFirestoreから設定:', data.counselingResult);
              setCounselingResult(data.counselingResult);
            } else {
              console.log('⚠️ FirestoreレスポンスにcounselingResultがない');
            }
          } else {
            const errorText = await response.text();
            console.log('🔥 [PRODUCTION] API error:', {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorText
            });
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
  
  console.log('🔥 Current counselingResult:', counselingResult);

  // LocalStorageからのデータ取得専用関数
  const refetchLocal = () => {
    console.log('🔥 LocalStorage refetch実行');
    try {
      if (typeof window !== 'undefined') {
        const localAnswers = localStorage.getItem('counselingAnswers');
        const localAnalysis = localStorage.getItem('aiAnalysis');
        
        if (localAnswers) {
          console.log('🔥 新しいLocalStorageデータを検出');
          const answers = JSON.parse(localAnswers);
          
          // テストデータ「利光湖太郎」を検出して削除
          if (answers.name === '利光湖太郎') {
            console.log('🔥 テストデータ検出 - localStorage削除');
            localStorage.removeItem('counselingAnswers');
            localStorage.removeItem('aiAnalysis');
            setCounselingResult(null);
            return;
          }
          
          const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
          
          console.log('🔥 LocalStorageから最新データ設定:', {
            カロリー: analysis?.nutritionPlan?.dailyCalories,
            PFC: analysis?.nutritionPlan?.macros
          });
          
          setCounselingResult({
            answers,
            aiAnalysis: analysis,
            userProfile: answers
          });
        } else {
          console.log('🔥 LocalStorageにデータなし');
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
        console.log('🔥 LocalStorage変更検出 - 自動refetch実行');
        // 少し遅延させてからrefetch（データの整合性を保つため）
        setTimeout(() => {
          refetchLocal();
        }, 100);
      }
    };

    const handleCustomRefresh = () => {
      console.log('🔥 カスタムリフレッシュイベント検出');
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
      console.log('🔥 Manual refetch called');
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
                  console.log('🔥 [PRODUCTION] Ignoring test data "利光湖太郎" from Firestore (refetch)');
                  return;
                }
                setCounselingResult(data.counselingResult);
              }
            }
          } catch (apiError) {
            console.log('🔥 Refetch API error (ignored):', apiError);
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