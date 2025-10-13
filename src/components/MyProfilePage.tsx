import React, { useState } from 'react';
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
import type { HealthGoal } from '@/types';
import { WeightChart } from './WeightChart';
import { 
  User,
  Scale,
  Utensils,
  Activity,
  MessageCircle,
  Brain,
  Settings,
  CreditCard,
  BookOpen,
  HelpCircle,
  Trophy,
  ChevronRight,
  Calendar,
  BarChart3
} from 'lucide-react';


interface MyProfilePageProps {
  onNavigateToSettings?: () => void;
  onNavigateToData?: () => void;
  onNavigateToPlanSettings?: () => void;
  onNavigateToPaymentSettings?: () => void;
  onNavigateToUserGuide?: () => void;
  onNavigateToContact?: () => void;
}

export function MyProfilePage({ 
  onNavigateToSettings, 
  onNavigateToData,
  onNavigateToPlanSettings,
  onNavigateToPaymentSettings,
  onNavigateToUserGuide,
  onNavigateToContact
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
  
  // 最も安全：LIFF認証完了まで待機のみ
  if (!isLiffReady || !isLoggedIn) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* プロフィールカードスケルトン */}
        <div className="bg-orange-50/90 rounded-xl shadow-sm border border-orange-200 p-6">
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
  
  // 本番環境用詳細デバッグ: counselingResultの内容を確認
  console.log('🔍 [MYPAGE-PROD] MyProfilePage counselingResult:', counselingResult);
  console.log('🔍 [MYPAGE-PROD] CounselingResult structure:', {
    hasCounselingResult: !!counselingResult,
    hasAnswers: !!(counselingResult?.answers),
    hasAiAnalysis: !!(counselingResult?.aiAnalysis),
    hasNutritionPlan: !!(counselingResult?.aiAnalysis?.nutritionPlan),
    nutritionPlanDetails: counselingResult?.aiAnalysis?.nutritionPlan,
    answersDetails: counselingResult?.answers
  });
  
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
  const finalCalories = mealManager?.calorieData?.targetCalories;
  const finalProtein = mealManager?.calorieData?.pfc?.proteinTarget;
  const finalFat = mealManager?.calorieData?.pfc?.fatTarget;
  const finalCarbs = mealManager?.calorieData?.pfc?.carbsTarget;
  
  // BMR（基礎代謝）データを取得 - ホームのCalorieCardと同じ計算方法を使用
  const bmrData = counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories 
    ? Math.round(counselingResult.aiAnalysis.nutritionPlan.dailyCalories * 0.7) // 摂取カロリーの70%を基礎代謝とする
    : (counselingResult?.aiAnalysis?.nutritionPlan?.bmr || 
       counselingResult?.answers?.bmr ||
       (counselingResult?.answers ? calculateBMR({
         weight: counselingResult.answers.weight || 0,
         height: counselingResult.answers.height || 0,
         age: counselingResult.answers.age || 0,
         gender: counselingResult.answers.gender || 'male'
       }) : null));
  
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

  // 編集フォームの状態（モーダル開いた時に最新値を反映）
  const [editForm, setEditForm] = useState({
    name: userName,
    age: age,
    gender: counselingResult?.answers?.gender || 'male',
    height: height,
    currentWeight: currentWeight,
    targetWeight: targetWeight,
    activityLevel: counselingResult?.answers?.activityLevel || 'normal',
    primaryGoal: counselingResult?.answers?.primaryGoal || 'weight_loss'
  });

  // モーダルが開かれた時に最新の値で更新
  const handleOpenEditModal = () => {
    setEditForm({
      name: userName,
      age: age,
      gender: counselingResult?.answers?.gender || 'male',
      height: height,
      currentWeight: currentWeight,
      targetWeight: targetWeight,
      activityLevel: counselingResult?.answers?.activityLevel || 'normal',
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
    try {
      console.log('🔥 プロフィール保存開始:', editForm);
      
      // ローカルストレージのカウンセリング結果を更新
      let updatedCounselingResult = null;
      if (typeof window !== 'undefined') {
        const existingAnswers = localStorage.getItem('counselingAnswers');
        const existingAnalysis = localStorage.getItem('aiAnalysis');
        
        console.log('🔥 既存のローカルストレージ:');
        console.log('  - counselingAnswers:', existingAnswers);
        console.log('  - aiAnalysis:', existingAnalysis ? 'exists' : 'null');
        
        if (existingAnswers) {
          const answers = JSON.parse(existingAnswers);
          console.log('🔥 既存のanswers:', answers);
          
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
          
          console.log('🔥 更新後のanswers:', updatedAnswers);
          localStorage.setItem('counselingAnswers', JSON.stringify(updatedAnswers));
          
          // aiAnalysisも更新してuserProfileを含める + カロリー・PFC再計算
          let updatedAnalysis = null;
          if (existingAnalysis) {
            const analysis = JSON.parse(existingAnalysis);
            
            // 新しいプロフィールでカロリー・PFC再計算
            const newProfile = {
              name: editForm.name,
              age: editForm.age,
              gender: editForm.gender,
              height: editForm.height,
              weight: editForm.currentWeight,
              targetWeight: editForm.targetWeight,
              activityLevel: editForm.activityLevel
            };
            
            // 目標に基づいてカロリー計算（HealthGoal型に準拠）
            const goals: HealthGoal[] = [{
              type: editForm.primaryGoal as HealthGoal['type'],
              targetValue: editForm.targetWeight
            }];
            
            const newCalorieTarget = calculateCalorieTarget(newProfile, goals);
            const newMacros = calculateMacroTargets(newCalorieTarget);
            
            console.log('🔥 カロリー・PFC再計算:', {
              oldCalories: analysis.nutritionPlan?.dailyCalories,
              newCalories: newCalorieTarget,
              oldMacros: analysis.nutritionPlan?.macros,
              newMacros: newMacros,
              profileChange: {
                weight: `${analysis.userProfile?.weight || 'なし'} → ${editForm.currentWeight}`,
                goal: `${analysis.userProfile?.primaryGoal || 'なし'} → ${editForm.primaryGoal}`,
                activity: `${analysis.userProfile?.activityLevel || 'なし'} → ${editForm.activityLevel}`
              }
            });
            
            updatedAnalysis = {
              ...analysis,
              userProfile: newProfile,
              nutritionPlan: {
                ...analysis.nutritionPlan,
                dailyCalories: newCalorieTarget,
                macros: {
                  protein: newMacros.protein,
                  carbs: newMacros.carbohydrates,
                  fat: newMacros.fat
                }
              }
            };
            console.log('🔥 更新後のanalysis:', updatedAnalysis);
            localStorage.setItem('aiAnalysis', JSON.stringify(updatedAnalysis));
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
        console.log('🔥 Firestoreに更新されたプロフィールを保存開始');
        try {
          const response = await fetch('/api/counseling/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lineUserId: liffUser.userId,
              counselingResult: updatedCounselingResult
            }),
          });
          
          if (response.ok) {
            console.log('✅ Firestoreプロフィール保存成功');
          } else {
            console.error('❌ Firestoreプロフィール保存失敗:', response.status);
          }
        } catch (error) {
          console.error('❌ Firestoreプロフィール保存エラー:', error);
        }
      }

      // モーダルを閉じる
      setIsEditModalOpen(false);
      
      console.log('🔥 プロフィール更新完了 - リアルタイム反映開始');
      
      // 1. カスタムイベントを発行して他のコンポーネントに即座に通知
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('counselingDataUpdated', {
          detail: { 
            type: 'profile_update',
            newCalories: newCalorieTarget,
            newMacros: newMacros
          }
        }));
        console.log('🔥 カスタムイベント発行 - 他コンポーネントに通知完了');
      }
      
      // 2. 現在のコンポーネントのデータも更新
      await refetch();
      
      console.log('🔥 プロフィール保存 - リアルタイム反映完了！');
      
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
  const healthMenuItems = [
    // データページは削除されたので、健康情報は全てホーム画面で完結
  ];

  const analysisMenuItems = [];

  const accountMenuItems = [
    {
      icon: Trophy,
      label: 'プラン・サブスクリプション',
      color: '#FBBF24',
      action: onNavigateToPlanSettings
    },
    {
      icon: CreditCard,
      label: '支払い設定',
      color: '#EF4444',
      action: onNavigateToPaymentSettings
    }
  ];

  const supportMenuItems = [
    {
      icon: BookOpen,
      label: '使い方ガイド',
      color: '#10B981',
      action: onNavigateToUserGuide
    },
    {
      icon: HelpCircle,
      label: 'お問い合わせ・サポート',
      color: '#6B7280',
      action: onNavigateToContact
    }
  ];

  const dataMenuItems = [];

  // iOS風のセクションレンダラー
  const renderSection = (title: string, items: any[]) => (
    <div className="space-y-2">
      {/* セクションタイトル - iOS風 */}
      <div className="px-4 pb-2">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</h3>
      </div>
      
      {/* メニューカード - iOS風 */}
      <div className="mx-4">
        <Card className="backdrop-blur-xl bg-orange-50/95 border border-orange-200/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start p-0 h-auto hover:bg-orange-100/70 rounded-none"
                  onClick={item.action}
                >
                  <div className="flex items-center space-x-4 py-4 px-4 w-full">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{backgroundColor: item.color}}
                    >
                      <Icon size={16} className="text-white" />
                    </div>
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
        <Card className="backdrop-blur-xl bg-gradient-to-br from-orange-50/95 to-orange-100/90 border border-orange-200/60 rounded-2xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            {/* ユーザー情報 */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 mb-0.5">{userProfile.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                {age && <><span>{age}歳</span><span>•</span></>}
                {gender && <><span>{gender}</span><span>•</span></>}
                {height && <span>{height}cm</span>}
                {!age && !gender && !height && <span>プロフィール未設定</span>}
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
            <div className="flex-1 text-center p-2 bg-orange-50/80 rounded-lg">
              <div className="text-xs text-slate-500">体重</div>
              <div className="font-bold text-slate-900 text-sm">{currentWeight ? `${currentWeight}kg` : '-'}</div>
            </div>
            <div className="flex-1 text-center p-2 bg-orange-50/80 rounded-lg">
              <div className="text-xs text-slate-500">BMI</div>
              <div className="font-bold text-slate-900 text-sm">{(currentWeight && height) ? userProfile.bmi : '-'}</div>
            </div>
            <div className="flex-1 text-center p-2 bg-orange-50/80 rounded-lg">
              <div className="text-xs text-slate-500">目標</div>
              <div className="font-bold text-slate-900 text-sm">{targetWeight ? `${targetWeight}kg` : '-'}</div>
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
                    <div className="flex-1 text-center p-2 bg-teal-50 rounded border border-teal-100">
                      <div className="text-xs text-teal-600">基礎代謝</div>
                      <div className="font-bold text-teal-900 text-sm">{Math.round(bmrData)}kcal</div>
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
                  <div className="flex-1 text-center p-1.5 bg-yellow-50 rounded border border-yellow-100">
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
              className="w-full text-green-600 border-green-200 hover:bg-green-50 h-8"
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
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">プロフィール編集</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {/* 名前 */}
            <div className="space-y-2">
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
              <label className="text-sm font-medium text-slate-700">年齢</label>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.age || ''}
                onChange={(e) => handleEditFormChange('age', parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="年齢を入力"
                className="text-center"
              />
            </div>

            {/* 性別 */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">性別</label>
              <Select value={editForm.gender} onValueChange={(value) => handleEditFormChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男性</SelectItem>
                  <SelectItem value="female">女性</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 身長 */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">身長 (cm)</label>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.height || ''}
                onChange={(e) => handleEditFormChange('height', parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="身長を入力"
                className="text-center"
              />
            </div>

            {/* 現在の体重 */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">現在の体重 (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="0.1"
                value={editForm.currentWeight || ''}
                onChange={(e) => handleEditFormChange('currentWeight', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="体重を入力"
                className="text-center"
              />
            </div>

            {/* 目標体重 */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">目標体重 (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="0.1"
                value={editForm.targetWeight || ''}
                onChange={(e) => handleEditFormChange('targetWeight', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="目標体重を入力"
                className="text-center"
              />
            </div>
          </div>

          {/* 運動量レベル */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">運動量レベル</label>
            <Select value={editForm.activityLevel} onValueChange={(value) => handleEditFormChange('activityLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="運動量を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低い（デスクワーク中心）</SelectItem>
                <SelectItem value="slightly_low">やや低い（軽い運動週1-2回）</SelectItem>
                <SelectItem value="normal">普通（中程度の運動週3-4回）</SelectItem>
                <SelectItem value="high">高い（激しい運動週5-6回）</SelectItem>
                <SelectItem value="very_high">非常に高い（毎日激しい運動）</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 目的 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">目的</label>
            <Select value={editForm.primaryGoal} onValueChange={(value) => handleEditFormChange('primaryGoal', value)}>
              <SelectTrigger>
                <SelectValue placeholder="目的を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_loss">減量</SelectItem>
                <SelectItem value="weight_gain">増量</SelectItem>
                <SelectItem value="muscle_gain">筋肉増強</SelectItem>
                <SelectItem value="fitness_improve">体重維持</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ボタン */}
          <div className="flex space-x-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1" size="sm">
                キャンセル
              </Button>
            </DialogClose>
            <Button onClick={handleSaveProfile} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}