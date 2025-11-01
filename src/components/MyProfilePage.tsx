import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useCounselingData } from '@/hooks/useCounselingData';
import { useMealData } from '@/hooks/useMealData';
import { useWeightData } from '@/hooks/useWeightData';
import { useDateBasedData } from '@/hooks/useDateBasedData';
import { calculateCalorieTarget, calculateMacroTargets, calculateTDEE, calculateBMR } from '@/utils/calculations';
import { useLatestProfile, getTargetValuesForDate } from '@/hooks/useProfileHistory';
import { withCounselingGuard } from '@/utils/counselingGuard';
import type { HealthGoal, UserProfile } from '@/types';
import { WeightChart } from './WeightChart';


interface MyProfilePageProps {
  onNavigateToSettings?: () => void;
  onNavigateToData?: () => void;
  onNavigateToPlanSettings?: () => void;
  onNavigateToUserGuide?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToReminderSettings?: () => void;
  onNavigateToCounseling?: () => void;
}

export function MyProfilePage({ 
  onNavigateToSettings, 
  onNavigateToData,
  onNavigateToPlanSettings,
  onNavigateToUserGuide,
  onNavigateToContact,
  onNavigateToReminderSettings,
  onNavigateToCounseling
}: MyProfilePageProps) {
  // 編集モーダルの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // 強制リフレッシュ用のキー
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 実際のユーザーデータを取得
  const { isLiffReady, isLoggedIn, liffUser, hasCompletedCounseling } = useAuth();
  const { counselingResult, refetch } = useCounselingData(); // 本番環境対応・エラー耐性強化版
  
  // 日付ベースのデータマネージャーを取得
  const dateBasedDataManager = useDateBasedData();
  
  // ホームと同じカロリーデータを取得
  const mealManager = useMealData(
    new Date(), 
    dateBasedDataManager?.dateBasedData || {}, 
    () => {},
    counselingResult
  );
  
  // 体重データを取得
  const weightManager = useWeightData(
    new Date(),
    dateBasedDataManager?.dateBasedData || {},
    () => {}
  );
  
  // 最新のプロフィールデータを取得
  const { profileData: latestProfile, refetch: refetchLatestProfile } = useLatestProfile();
  
  // 最も安全：LIFF認証完了まで待機のみ
  if (!isLiffReady || !isLoggedIn) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* プロフィールカードスケルトン */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        {/* メニュースケルトン */}
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    );
  }
  
  
  // リアクティブなプロフィールデータ計算（refreshKey、latestProfile、counselingResultの変更に反応）
  const { userProfile, targetValues, finalCalories, finalProtein, finalFat, finalCarbs, bmrData } = useMemo(() => {
    
    // カウンセリング結果の名前を優先、LIFFは最後のフォールバック（認証後のみ）
    // テストデータ「利光湖太郎」を除外
    const counselingName = counselingResult?.answers?.name === '利光湖太郎' ? null : counselingResult?.answers?.name;
    const profileName = counselingResult?.userProfile?.name === '利光湖太郎' ? null : counselingResult?.userProfile?.name;
    const userName = counselingName || profileName || liffUser?.displayName || "ユーザー";
    const age = counselingResult?.answers?.age || counselingResult?.userProfile?.age || null;
    const gender = counselingResult?.answers?.gender === 'male' ? '男性' : 
                   counselingResult?.answers?.gender === 'female' ? '女性' : 
                   counselingResult?.userProfile?.gender === 'male' ? '男性' : 
                   counselingResult?.userProfile?.gender === 'female' ? '女性' : 
                   null;
    const height = counselingResult?.answers?.height || counselingResult?.userProfile?.height || null;
    const currentWeight = counselingResult?.answers?.weight || counselingResult?.userProfile?.weight || null;
    const targetWeight = counselingResult?.answers?.targetWeight || counselingResult?.userProfile?.targetWeight || null;
    
    // 固定値を完全削除 - データがある時のみ表示
    // 最新のプロフィールデータに基づく目標値を取得
    const targetValues = getTargetValuesForDate(latestProfile, counselingResult);
    
    const finalCalories = targetValues.targetCalories;
    const finalProtein = targetValues.macros.protein;
    const finalFat = targetValues.macros.fat;
    const finalCarbs = targetValues.macros.carbs;
    const bmrData = targetValues.bmr;
    
    // BMI計算（身長と体重がある場合のみ）
    const bmi = height > 0 && currentWeight > 0 ? Math.round((currentWeight / Math.pow(height / 100, 2)) * 10) / 10 : 0;
    
    // ユーザープロフィールデータ（実際のデータを使用）
    const userProfile = {
      name: userName,
      age: age,
      gender: gender,
      height: height,
      currentWeight: currentWeight,
      targetWeight: targetWeight,
      targetDate: counselingResult?.answers?.targetDate || "未設定",
      bmi: bmi,
      joinDate: "2024年1月" // LIFF初回登録日など、実際のデータがあれば使用
    };

    
    return { userProfile, targetValues, finalCalories, finalProtein, finalFat, finalCarbs, bmrData };
  }, [refreshKey, latestProfile, counselingResult, liffUser?.displayName]);

  // 編集フォームの状態（モーダル開いた時に最新値を反映）
  const [editForm, setEditForm] = useState({
    name: userProfile.name,
    age: userProfile.age,
    gender: counselingResult?.answers?.gender || 'male',
    height: userProfile.height,
    currentWeight: userProfile.currentWeight,
    targetWeight: userProfile.targetWeight,
    activityLevel: counselingResult?.answers?.activityLevel || 'moderate',
    primaryGoal: counselingResult?.answers?.primaryGoal || 'weight_loss'
  });

  // モーダルが開かれた時に最新の値で更新
  const handleOpenEditModal = () => {
    setEditForm({
      name: userProfile.name,
      age: userProfile.age,
      gender: counselingResult?.answers?.gender || 'male',
      height: userProfile.height,
      currentWeight: userProfile.currentWeight,
      targetWeight: userProfile.targetWeight,
      activityLevel: counselingResult?.answers?.activityLevel || 'moderate',
      primaryGoal: counselingResult?.answers?.primaryGoal || 'weight_loss'
    });
    setIsEditModalOpen(true);
  };

  // 編集フォームの更新
  const handleEditFormChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // プロフィール保存
  const handleSaveProfile = async () => {
    // 🚀 即座にUI更新（ユーザー体験向上）
    setIsEditModalOpen(false);
    setRefreshKey(prev => prev + 1);
    alert('プロフィールを保存しました！');
    
    // 変数を関数の先頭で定義（スコープエラー回避）
    let newCalorieTarget = 0;
    let newMacros = { protein: 0, fat: 0, carbs: 0 };
    let newBMR = 0;
    let newTDEE = 0;

    // バックグラウンドで保存処理実行
    try {
      
      // ローカルストレージのカウンセリング結果を更新
      let updatedCounselingResult = null;
      if (typeof window !== 'undefined') {
        const existingAnswers = localStorage.getItem('counselingAnswers');
        const existingAnalysis = localStorage.getItem('aiAnalysis');
        
        
        if (existingAnswers) {
          const answers = JSON.parse(existingAnswers);
          
          const updatedAnswers = {
            ...answers,
            name: editForm.name,
            age: editForm.age,
            gender: editForm.gender,
            height: editForm.height,
            weight: editForm.currentWeight,
            targetWeight: editForm.targetWeight,
            activityLevel: editForm.activityLevel,
            primaryGoal: editForm.primaryGoal
          };
          
          localStorage.setItem('counselingAnswers', JSON.stringify(updatedAnswers));
          
          // aiAnalysisも更新してuserProfileを含める + カロリー・PFC再計算
          let updatedAnalysis = null;
          if (existingAnalysis) {
            const analysis = JSON.parse(existingAnalysis);
            
            // カロリー・PFC再計算は後で一括実行
            updatedAnalysis = analysis;
          }
          
          // Firestoreに保存するためのデータを準備
          updatedCounselingResult = {
            answers: updatedAnswers,
            aiAnalysis: updatedAnalysis,
            userProfile: {
              name: editForm.name,
              age: editForm.age,
              gender: editForm.gender,
              height: editForm.height,
              weight: editForm.currentWeight,
              targetWeight: editForm.targetWeight,
              activityLevel: editForm.activityLevel,
              primaryGoal: editForm.primaryGoal
            }
          };
        }
      }

      // Firestoreに保存
      if (updatedCounselingResult && liffUser?.userId) {
        try {
          const response = await fetch('/api/counseling/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lineUserId: liffUser.userId,
              counselingResult: updatedCounselingResult
            }),
          });
          
          if (!response.ok) {
            console.error('❌ Firestoreプロフィール保存失敗:', response.status);
          }
        } catch (error) {
          console.error('❌ Firestoreプロフィール保存エラー:', error);
        }
      }

      // モーダルを閉じる
      setIsEditModalOpen(false);
      
      // プロフィール履歴をFirebaseに保存
      if (liffUser?.userId) {
        try {
          
          // 新しいプロフィールで計算（カウンセリング結果の有無に関係なく実行）
          const newProfile: UserProfile = {
            name: editForm.name,
            age: editForm.age,
            gender: editForm.gender,
            height: editForm.height,
            weight: editForm.currentWeight,
            targetWeight: editForm.targetWeight,
            activityLevel: editForm.activityLevel as UserProfile['activityLevel'],
            goals: [{
              type: editForm.primaryGoal as HealthGoal['type'],
              targetValue: editForm.targetWeight
            }],
            sleepDuration: '8h_plus',
            sleepQuality: 'normal',
            exerciseHabit: 'yes',
            exerciseFrequency: 'weekly_3_4',
            mealFrequency: '3',
            snackFrequency: 'sometimes',
            alcoholFrequency: 'none'
          };

          // 目標に基づいてカロリー計算（必ず実行）
          const goals: HealthGoal[] = [{
            type: editForm.primaryGoal as HealthGoal['type'],
            targetValue: editForm.targetWeight
          }];
          
          newCalorieTarget = calculateCalorieTarget(newProfile, goals);
          newMacros = calculateMacroTargets(newCalorieTarget);
          newBMR = calculateBMR(newProfile);
          newTDEE = calculateTDEE(newProfile);
          
          // プロフィール履歴をAPIで保存（Promise化）
          const profileHistoryPromise = fetch('/api/profile/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lineUserId: liffUser.userId,
              profileData: {
                name: editForm.name,
                age: editForm.age,
                gender: editForm.gender,
                height: editForm.height,
                weight: editForm.currentWeight,
                targetWeight: editForm.targetWeight,
                activityLevel: editForm.activityLevel,
                primaryGoal: editForm.primaryGoal,
                // 計算された値も保存
                targetCalories: newCalorieTarget,
                bmr: newBMR,
                tdee: newTDEE,
                macros: newMacros,
                changeDate: new Date().toISOString().split('T')[0]
              }
            })
          }).then(async response => {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`プロフィール履歴保存失敗: ${errorData.error}`);
            }
            return response.json();
          });
          
          // LocalStorageとFirestoreのカウンセリングデータも更新（同期保持）
          const updatedCounselingData = {
            answers: {
              ...counselingResult?.answers,
              name: editForm.name,
              age: editForm.age,
              gender: editForm.gender,
              height: editForm.height,
              weight: editForm.currentWeight,
              targetWeight: editForm.targetWeight,
              activityLevel: editForm.activityLevel,
              primaryGoal: editForm.primaryGoal
            },
            userProfile: {
              name: editForm.name,
              age: editForm.age,
              gender: editForm.gender,
              height: editForm.height,
              weight: editForm.currentWeight,
              targetWeight: editForm.targetWeight,
              activityLevel: editForm.activityLevel,
              goals: [{
                type: editForm.primaryGoal,
                targetValue: editForm.targetWeight
              }]
            },
            aiAnalysis: {
              ...counselingResult?.aiAnalysis,
              nutritionPlan: {
                ...counselingResult?.aiAnalysis?.nutritionPlan,
                dailyCalories: newCalorieTarget,
                bmr: newBMR,
                tdee: newTDEE,
                macros: newMacros
              }
            }
          };
          
          // LocalStorage更新（カウンセリングと同じキーを使用）
          localStorage.setItem('counselingAnswers', JSON.stringify(updatedCounselingData.answers));
          localStorage.setItem('counselingResult', JSON.stringify({
            id: `profile_update_${Date.now()}`,
            answers: updatedCounselingData.answers,
            results: {
              bmr: Math.round(newBMR),
              tdee: Math.round(newTDEE),
              targetCalories: Math.round(newCalorieTarget),
              targetWeight: editForm.targetWeight,
              pfc: newMacros
            },
            aiAnalysis: updatedCounselingData.aiAnalysis,
            createdAt: new Date().toISOString()
          }));
          localStorage.setItem('hasCompletedCounseling', 'true');
          
          // カウンセリング結果APIでFirestoreも更新（並列実行）
          const counselingUpdatePromise = fetch('/api/counseling/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lineUserId: liffUser.userId,
              counselingResult: updatedCounselingData
            })
          }).catch(error => {
            console.error('⚠️ カウンセリングデータ更新エラー（続行）:', error);
            return null;
          });

          // 両方のAPI呼び出しを並列実行
          await Promise.all([profileHistoryPromise, counselingUpdatePromise]);

          // Firestore書き込み完了後にイベントを発行
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('counselingDataUpdated', {
              detail: { 
                type: 'profile_update',
                newCalories: newCalorieTarget,
                newMacros: newMacros,
                timestamp: new Date().toISOString()
              }
            }));
            
            window.dispatchEvent(new CustomEvent('profileHistoryUpdated', {
              detail: { 
                type: 'profile_save',
                userId: liffUser.userId,
                newCalories: newCalorieTarget,
                newMacros: newMacros,
                timestamp: new Date().toISOString()
              }
            }));
            
          }

          // 保存完了（UIは既に更新済み）
          
          // 各データソースを手動リフレッシュ
          refetch();
          refetchLatestProfile();
          
        } catch (error) {
          console.error('❌ プロフィール履歴保存エラー詳細:', {
            error: error.message,
            name: error.name,
            stack: error.stack
          });
          
          // エラーアラート表示
          alert(`プロフィール履歴保存エラー: ${error.message}`);
        }
      }

      
      // データ更新完了後、少し遅延してからフックのリフレッシュ実行
      setTimeout(async () => {
        try {
          await Promise.all([
            refetch(),
            refetchLatestProfile()
          ]);
        } catch (refreshError) {
          console.error('⚠️ フックリフレッシュエラー:', refreshError);
        }
      }, 500); // 500ms遅延でFirestore反映を確実に待つ
      
      // 強制リフレッシュでコンポーネント再描画
      setRefreshKey(prev => prev + 1);
      
      
      
      // 4. 編集モーダルを閉じる
      setIsEditModalOpen(false);
      
    } catch (error) {
      console.error('プロフィール保存エラー:', error);
      alert('プロフィールの保存に失敗しました。再度お試しください。');
    }
  };





  // BMIステータス取得
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: '低体重', color: '#3B82F6' };
    if (bmi < 25) return { status: '適正体重', color: '#10B981' };
    if (bmi < 30) return { status: '肥満（1度）', color: '#F59E0B' };
    return { status: '肥満（2度以上）', color: '#EF4444' };
  };

  const bmiStatus = getBMIStatus(userProfile.bmi);

  // メニューアイテム - iOS設定風に整理（データページ削除済み）


  const accountMenuItems = [
    {
      label: 'リマインダー設定',
      color: '#8B5CF6',
      action: onNavigateToCounseling ? withCounselingGuard(
        counselingResult,
        onNavigateToCounseling,
        'リマインダー設定',
        onNavigateToReminderSettings || (() => {})
      ) : onNavigateToReminderSettings
    },
    {
      label: 'プラン・サブスクリプション',
      color: '#FBBF24',
      action: onNavigateToCounseling ? withCounselingGuard(
        counselingResult,
        onNavigateToCounseling,
        'プラン設定',
        onNavigateToPlanSettings || (() => {})
      ) : onNavigateToPlanSettings
    }
  ];

  const supportMenuItems = [
    {
      label: '使い方ガイド',
      color: '#10B981',
      action: onNavigateToUserGuide
    },
    {
      label: 'お問い合わせ・サポート',
      color: '#6B7280',
      action: onNavigateToContact
    },
    {
      label: '利用規約',
      color: '#374151',
      action: () => window.open('/terms', '_blank')
    },
    {
      label: 'プライバシーポリシー',
      color: '#374151',
      action: () => window.open('/privacy', '_blank')
    }
  ];


  // iOS風のセクションレンダラー
  const renderSection = (title: string, items: any[]) => (
    <div className="space-y-2">
      {/* セクションタイトル - iOS風 */}
      <div className="px-4 pb-2">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</h3>
      </div>
      
      {/* メニューカード - iOS風 */}
      <div className="mx-4">
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => {
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start p-0 h-auto hover:bg-slate-50 rounded-none"
                  onClick={item.action}
                >
                  <div className="flex items-center py-4 px-4 w-full">
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-slate-900">{item.label}</p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );



  return (
    <div key={refreshKey} className="space-y-8 pb-4">
      {/* プロフィールヘッダー - iOS風アバター付き */}
      <div className="px-4">
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 p-3">
          <div className="flex items-center justify-between mb-2">
            {/* ユーザー情報 */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 mb-0.5">{userProfile.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                {userProfile.age && <><span>{userProfile.age}歳</span><span>•</span></>}
                {userProfile.gender && <><span>{userProfile.gender}</span><span>•</span></>}
                {userProfile.height && <span>{userProfile.height}cm</span>}
                {!userProfile.age && !userProfile.gender && !userProfile.height && <span>プロフィール未設定</span>}
              </div>
            </div>
            
            {/* BMIバッジ */}
            <Badge 
              style={{backgroundColor: bmiStatus.color}} 
              className="text-white text-xs px-2 py-1 rounded-lg"
            >
              {bmiStatus.status}
            </Badge>
          </div>

          {/* 健康指標 - コンパクト横並び */}
          <div className="flex space-x-2">
            <div className="flex-1 text-center p-2 bg-white/60 rounded-lg">
              <div className="text-xs text-slate-500">体重</div>
              <div className="font-bold text-slate-900 text-sm">{userProfile.currentWeight ? `${userProfile.currentWeight}kg` : '-'}</div>
            </div>
            <div className="flex-1 text-center p-2 bg-white/60 rounded-lg">
              <div className="text-xs text-slate-500">BMI</div>
              <div className="font-bold text-slate-900 text-sm">{(userProfile.currentWeight && userProfile.height) ? userProfile.bmi : '-'}</div>
            </div>
            <div className="flex-1 text-center p-2 bg-white/60 rounded-lg">
              <div className="text-xs text-slate-500">目標</div>
              <div className="font-bold text-slate-900 text-sm">{userProfile.targetWeight ? `${userProfile.targetWeight}kg` : '-'}</div>
            </div>
          </div>

          {/* 1日の目安 - カロリー・PFC */}
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-slate-600">1日の目安</div>
            
            {/* データがある時のみ表示 */}
            {finalCalories && finalProtein && finalFat && finalCarbs ? (
              <>
                {/* カロリーセクション - BMRがあれば横並び */}
                {bmrData ? (
                  <div className="flex space-x-1.5">
                    <div className="flex-1 text-center p-2 bg-blue-50 rounded border border-blue-100">
                      <div className="text-xs text-blue-600">摂取カロリー</div>
                      <div className="font-bold text-blue-900 text-sm">{finalCalories}kcal</div>
                    </div>
                    <div className="flex-1 text-center p-2 bg-orange-50 rounded border border-orange-100" style={{backgroundColor: '#fff7ed', borderColor: '#fed7aa'}}>
                      <div className="text-xs text-orange-600">基礎代謝</div>
                      <div className="font-bold text-orange-900 text-sm">{Math.round(bmrData)}kcal</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-2 bg-blue-50 rounded border border-blue-100">
                    <div className="text-xs text-blue-600">摂取カロリー</div>
                    <div className="font-bold text-blue-900 text-sm">{finalCalories}kcal</div>
                  </div>
                )}
                
                {/* PFC */}
                <div className="flex space-x-1.5">
                  <div className="flex-1 text-center p-1.5 bg-red-50 rounded border border-red-100">
                    <div className="text-xs text-red-600">タンパク質</div>
                    <div className="font-bold text-red-900 text-sm">{finalProtein}g</div>
                  </div>
                  <div className="flex-1 text-center p-1.5 bg-yellow-50 rounded border border-yellow-100" style={{backgroundColor: '#fefce8', borderColor: '#fef3c7'}}>
                    <div className="text-xs text-yellow-600">脂質</div>
                    <div className="font-bold text-yellow-900 text-sm">{finalFat}g</div>
                  </div>
                  <div className="flex-1 text-center p-1.5 bg-green-50 rounded border border-green-100">
                    <div className="text-xs text-green-600">炭水化物</div>
                    <div className="font-bold text-green-900 text-sm">{finalCarbs}g</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-2 text-slate-500 text-sm">読み込み中...</div>
            )}
          </div>
          
          {/* アクションボタン */}
          <div className="mt-3 pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditModal}
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
            >
              プロフィール編集
            </Button>
          </div>
        </Card>
      </div>

      {/* 体重グラフ */}
      <div className="px-4">
        {weightManager?.realWeightData && (
          <WeightChart 
            data={weightManager.realWeightData}
            period="month"
            height={200}
            targetWeight={counselingResult?.answers?.targetWeight || weightManager?.weightSettings?.targetWeight || 70}
            currentWeight={weightManager?.weightData?.current || counselingResult?.answers?.weight || 0}
            counselingResult={counselingResult}
          />
        )}
      </div>

      {/* アカウント・プラン */}
      {renderSection('アカウント・プラン', accountMenuItems)}

      {/* サポート */}
      {renderSection('サポート', supportMenuItems)}

      {/* プロフィール編集モーダル */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-sm mx-auto my-8">
          <DialogHeader>
            <DialogTitle className="text-center">プロフィール編集</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 py-1">
            {/* 名前 */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">名前</label>
              <Input
                value={editForm.name}
                onChange={(e) => handleEditFormChange('name', e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="名前を入力"
              />
            </div>

            {/* 年齢 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">年齢</label>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.age || ''}
                onChange={(e) => handleEditFormChange('age', parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="年齢を入力"
                className="text-center text-sm h-8"
              />
            </div>

            {/* 性別 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">性別</label>
              <Select value={editForm.gender} onValueChange={(value) => handleEditFormChange('gender', value)}>
                <SelectTrigger className="text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{minWidth: '280px', width: '280px'}} className="p-2">
                  <SelectItem value="male" className="text-base py-3 px-4">男性</SelectItem>
                  <SelectItem value="female" className="text-base py-3 px-4">女性</SelectItem>
                  <SelectItem value="other" className="text-base py-3 px-4">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 身長 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">身長 (cm)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={editForm.height || ''}
                onChange={(e) => handleEditFormChange('height', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="身長を入力"
                className="text-center text-sm h-8"
              />
            </div>

            {/* 現在の体重 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">現在の体重 (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="0.1"
                value={editForm.currentWeight || ''}
                onChange={(e) => handleEditFormChange('currentWeight', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="体重を入力"
                className="text-center text-sm h-8"
              />
            </div>

            {/* 目標体重 */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">目標体重 (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="0.1"
                value={editForm.targetWeight || ''}
                onChange={(e) => handleEditFormChange('targetWeight', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="目標体重を入力"
                className="text-center text-sm h-8"
              />
            </div>
          </div>

          {/* 運動量レベル */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">運動量レベル</label>
            <Select value={editForm.activityLevel} onValueChange={(value) => handleEditFormChange('activityLevel', value)}>
              <SelectTrigger className="text-sm h-8">
                <SelectValue placeholder="運動量を選択" />
              </SelectTrigger>
              <SelectContent style={{minWidth: '280px', width: '280px'}} className="p-2">
                <SelectItem value="sedentary" className="text-base py-3 px-4">ほとんど運動しない</SelectItem>
                <SelectItem value="light" className="text-base py-3 px-4">軽い運動をする</SelectItem>
                <SelectItem value="moderate" className="text-base py-3 px-4">定期的に運動する</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 目的 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">目的</label>
            <Select value={editForm.primaryGoal} onValueChange={(value) => handleEditFormChange('primaryGoal', value)}>
              <SelectTrigger className="text-sm h-8">
                <SelectValue placeholder="目的を選択" />
              </SelectTrigger>
              <SelectContent style={{minWidth: '280px', width: '280px'}} className="p-2">
                <SelectItem value="weight_loss" className="text-base py-3 px-4">ダイエット</SelectItem>
                <SelectItem value="muscle_gain" className="text-base py-3 px-4">筋肉量アップ</SelectItem>
                <SelectItem value="maintenance" className="text-base py-3 px-4">健康維持</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ボタン */}
          <div className="flex space-x-2 pt-1">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1" size="sm">
                キャンセル
              </Button>
            </DialogClose>
            <Button onClick={handleSaveProfile} className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm">
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}