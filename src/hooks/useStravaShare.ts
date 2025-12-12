import { useState, useCallback } from 'react';
import React from 'react';
import html2canvas from 'html2canvas';
import { DailyLogData } from '@/types/dailyLog';

interface RecordData {
  date: string;
  weight?: number;
  weightDiff?: number;
  calories: number;
  targetCalories: number;
  protein: number;
  targetProtein: number;
  fat: number;
  targetFat: number;
  carbs: number;
  targetCarbs: number;
  exerciseTime: number;
  exerciseBurned: number;
}

export function useStravaShare() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 記録データをDailyLogData形式に変換
  const formatDataForCard = useCallback((recordData: RecordData): DailyLogData => {
    return {
      date: new Date(recordData.date),
      weight: {
        current: recordData.weight || 0,
        diff: recordData.weightDiff || 0
      },
      calories: {
        current: recordData.calories,
        target: recordData.targetCalories
      },
      pfc: {
        p: { current: recordData.protein, target: recordData.targetProtein },
        f: { current: recordData.fat, target: recordData.targetFat },
        c: { current: recordData.carbs, target: recordData.targetCarbs }
      },
      exercise: {
        minutes: recordData.exerciseTime,
        caloriesBurned: recordData.exerciseBurned
      }
    };
  }, []);
  
  // DailyLogCardコンポーネントを使って画像生成
  const generateImage = useCallback(async (recordData: RecordData): Promise<Blob> => {
    setIsGenerating(true);
    
    try {
      // 一時的にコンポーネントをDOMに追加
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.zIndex = '-1000';
      document.body.appendChild(container);
      
      // ReactコンポーネントをDOMに渡すためのプロミス
      return new Promise((resolve, reject) => {
        import('react-dom/client').then(({ createRoot }) => {
          import('../components/share/DailyLogCard').then(({ DailyLogCard }) => {
            const root = createRoot(container);
            const cardData = formatDataForCard(recordData);
            
            // コンポーネントをレンダリング
            root.render(
              React.createElement(DailyLogCard, {
                data: cardData,
                theme: 'text-blue-500',
                id: 'share-card',
                isJapanese: true,
                isDarkMode: true,
                bgClass: 'bg-zinc-950'
              })
            );
            
            // 少し待ってからhtml2canvasで画像化
            setTimeout(() => {
              const cardElement = document.getElementById('share-card');
              
              if (!cardElement) {
                reject(new Error('Card element not found'));
                return;
              }
              
              html2canvas(cardElement, {
                width: 375,
                height: 640,
                scale: 2, // 高解像度
                backgroundColor: null,
                useCORS: true,
                allowTaint: true
              }).then(canvas => {
                canvas.toBlob((blob) => {
                  // 清理
                  root.unmount();
                  document.body.removeChild(container);
                  
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Failed to generate blob'));
                  }
                }, 'image/png', 0.95);
              }).catch(error => {
                // 清理
                root.unmount();
                document.body.removeChild(container);
                reject(error);
              });
            }, 100);
          });
        });
      });
      
    } catch (error) {
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [formatDataForCard]);
  
  // 共有実行
  const shareRecord = useCallback(async (recordData: RecordData) => {
    try {
      setIsGenerating(true);
      
      // 画像生成
      const imageBlob = await generateImage(recordData);
      const imageFile = new File([imageBlob], `healthy-record-${recordData.date}.png`, { 
        type: 'image/png' 
      });
      
      // Web Share API が利用可能かチェック
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          files: [imageFile],
          title: `ヘルシーくん記録 - ${recordData.date}`,
          text: `${recordData.date}の記録\n🔥 ${recordData.calories}kcal\n💪 ${recordData.exerciseTime}分運動`
        });
        return { success: true, method: 'web-share-api' };
      }
      
      // フォールバック: ダウンロード
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `healthy-record-${recordData.date.replace(/\//g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true, method: 'download' };
      
    } catch (error) {
      console.error('Share failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  }, [generateImage]);
  
  // 記録データを取得してフォーマット
  const formatRecordData = useCallback((
    selectedDate: Date,
    mealData: any,
    exerciseData: any[],
    weightData: any,
    targetValues?: any
  ): RecordData => {
    const dateString = selectedDate.toLocaleDateString('ja-JP');
    
    // 食事データから正しくPFC計算
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    mealTypes.forEach(type => {
      if (mealData[type] && Array.isArray(mealData[type])) {
        mealData[type].forEach((meal: any) => {
          totalCalories += meal.calories || 0;
          totalProtein += meal.protein || 0;
          totalFat += meal.fat || 0;
          totalCarbs += meal.carbs || 0;
        });
      }
    });
    
    // 運動データ集計
    const todayExercises = exerciseData.filter(exercise => {
      const exerciseDate = new Date(exercise.date).toLocaleDateString('sv-SE');
      const targetDate = selectedDate.toLocaleDateString('sv-SE');
      return exerciseDate === targetDate;
    });
    
    const totalExerciseTime = todayExercises.reduce((sum, exercise) => {
      return sum + (exercise.duration || 0);
    }, 0);
    
    // 消費カロリー計算（簡易版）
    const exerciseBurned = totalExerciseTime * 10; // 1分あたり10kcal程度
    
    // 目標値
    const targetCalories = targetValues?.targetCalories || 2000;
    const targetProtein = targetValues?.macros?.protein || 120;
    const targetFat = targetValues?.macros?.fat || 67;
    const targetCarbs = targetValues?.macros?.carbs || 250;
    
    return {
      date: dateString,
      weight: weightData?.current,
      weightDiff: 0, // TODO: 前日との差分計算
      calories: Math.round(totalCalories),
      targetCalories: targetCalories,
      protein: Math.round(totalProtein * 10) / 10,
      targetProtein: targetProtein,
      fat: Math.round(totalFat * 10) / 10,
      targetFat: targetFat,
      carbs: Math.round(totalCarbs * 10) / 10,
      targetCarbs: targetCarbs,
      exerciseTime: totalExerciseTime,
      exerciseBurned: exerciseBurned
    };
  }, []);
  
  return {
    isGenerating,
    shareRecord,
    formatRecordData,
    generateImage: (recordData: RecordData) => generateImage(recordData)
  };
}