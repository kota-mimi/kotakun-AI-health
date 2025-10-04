import React, { useState } from 'react';
import { useAuth } from './useAuth';

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
  console.log('🔥 useCounselingData hook - LIVE API VERSION FOR PRODUCTION');
  const { liffUser } = useAuth();
  
  const lineUserId = liffUser?.userId;
  console.log('🔥 lineUserId:', lineUserId);
  
  const [counselingResult, setCounselingResult] = useState<CounselingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useLayoutEffectを使用してSSRの問題を回避
  React.useLayoutEffect(() => {
    console.log('🔥 useLayoutEffect triggered');
    
    const fetchData = async () => {
      if (!lineUserId) {
        console.log('🔥 No lineUserId, skipping API call');
        setIsLoading(false);
        return;
      }

      console.log('🔥 Making API call with lineUserId:', lineUserId);
      
      try {
        // Firestoreから最新データを取得（優先）
        const response = await fetch('/api/counseling/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId }),
        });

        console.log('🔥 API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('🔥 Firestore API SUCCESS! Data received:', data);
          
          if (data.counselingResult) {
            console.log('🔥 Setting Firestore counseling result:', data.counselingResult);
            setCounselingResult(data.counselingResult);
          } else {
            console.log('🔥 No Firestore data, checking localStorage fallback');
            // Firestoreにない場合のみローカルストレージを確認
            const localAnswers = localStorage.getItem('counselingAnswers');
            const localAnalysis = localStorage.getItem('aiAnalysis');
            
            if (localAnswers) {
              console.log('🔥 Found local counseling data as fallback');
              const answers = JSON.parse(localAnswers);
              const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
              
              setCounselingResult({
                answers,
                aiAnalysis: analysis,
                userProfile: answers
              });
            }
          }
        } else {
          console.log('🔥 API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('🔥 API fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [lineUserId]);
  
  console.log('🔥 Current counselingResult:', counselingResult);

  return {
    counselingResult,
    isLoading,
    refetch: async () => {
      console.log('🔥 Manual refetch called');
      // useEffectと同じロジックを再実行
      if (lineUserId) {
        setIsLoading(true);
        try {
          // まずローカルストレージから最新のデータを確認
          const localAnswers = localStorage.getItem('counselingAnswers');
          const localAnalysis = localStorage.getItem('aiAnalysis');
          
          if (localAnswers) {
            console.log('🔥 Refetch: Found local counseling data, using it');
            const answers = JSON.parse(localAnswers);
            const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
            
            // analysisにuserProfileがない場合はanswersから作成
            if (analysis && !analysis.userProfile) {
              analysis.userProfile = {
                name: answers.name,
                age: answers.age,
                gender: answers.gender,
                height: answers.height,
                weight: answers.weight,
                targetWeight: answers.targetWeight
              };
            }
            
            setCounselingResult({
              answers,
              aiAnalysis: analysis,
              userProfile: answers // answersをuserProfileとしても使用
            });
            setIsLoading(false);
            return;
          }

          // ローカルストレージにない場合はAPIから取得
          const response = await fetch('/api/counseling/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.counselingResult) {
              setCounselingResult(data.counselingResult);
            }
          }
        } catch (error) {
          console.error('Refetch failed:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
  };
}