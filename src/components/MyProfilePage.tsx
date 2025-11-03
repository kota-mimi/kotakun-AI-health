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
import { useLatestProfile } from '@/hooks/useProfileHistory';
import { withCounselingGuard } from '@/utils/counselingGuard';
import type { HealthGoal, UserProfile } from '@/types';
import { WeightChart } from './WeightChart';
import { TargetSettingsModal } from './TargetSettingsModal';


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
  // 目標設定モーダルの状態
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  // 保存中の状態
  const [isSaving, setIsSaving] = useState(false);
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
  
  
  // シンプルなプロフィールデータ（重い計算を削除）
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
  
  // プロフィール履歴の体重を最優先にして、daily recordsは参考値程度にする
  const currentWeight = latestProfile?.weight || 
                        counselingResult?.answers?.weight || 
                        counselingResult?.userProfile?.weight || 
                        weightManager?.weightData?.current || 
                        null;
  const targetWeight = latestProfile?.targetWeight || 
                       counselingResult?.answers?.targetWeight || 
                       counselingResult?.userProfile?.targetWeight || 
                       null;
  
  
  // ユーザープロフィールデータ（軽量化）
  const userProfile = {
    name: userName,
    age: age,
    gender: gender,
    height: height,
    currentWeight: currentWeight,
    targetWeight: targetWeight,
    targetDate: counselingResult?.answers?.targetDate || "未設定",
    joinDate: "2024年1月"
  };

  // 目標値は latestProfile から直接取得（即座反映）
  // カウンセリング結果もフォールバックとして使用
  const finalCalories = latestProfile?.targetCalories || 
                       counselingResult?.results?.targetCalories || 
                       counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories || 
                       1600;
  const finalProtein = latestProfile?.macros?.protein || 
                      counselingResult?.results?.pfc?.protein || 
                      counselingResult?.aiAnalysis?.nutritionPlan?.macros?.protein || 
                      100;
  const finalFat = latestProfile?.macros?.fat || 
                  counselingResult?.results?.pfc?.fat || 
                  counselingResult?.aiAnalysis?.nutritionPlan?.macros?.fat || 
                  53;
  const finalCarbs = latestProfile?.macros?.carbs || 
                    counselingResult?.results?.pfc?.carbs || 
                    counselingResult?.aiAnalysis?.nutritionPlan?.macros?.carbs || 
                    180;

  // 編集フォームの状態（モーダル開いた時に最新値を反映）
  const [editForm, setEditForm] = useState({
    name: userProfile.name,
    age: userProfile.age,
    gender: counselingResult?.answers?.gender || 'male',
    height: userProfile.height,
    currentWeight: userProfile.currentWeight,
    targetWeight: userProfile.targetWeight
  });

  // モーダルが開かれた時に最新の値で更新
  const handleOpenEditModal = () => {
    setEditForm({
      name: userProfile.name,
      age: userProfile.age,
      gender: counselingResult?.answers?.gender || 'male',
      height: userProfile.height,
      currentWeight: userProfile.currentWeight,
      targetWeight: userProfile.targetWeight
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
    // 🚀 楽観的更新：保存前に即座にUIを更新
    setIsSaving(true);
    
    // 即座にモーダルを閉じる
    setIsEditModalOpen(false);
    
    // UI強制更新
    setRefreshKey(prev => prev + 1);
    
    // バックグラウンドで保存処理
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
            targetWeight: editForm.targetWeight
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
              targetWeight: editForm.targetWeight
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
            activityLevel: 'moderate' as UserProfile['activityLevel'],
            goals: [{
              type: 'maintenance' as HealthGoal['type'],
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

          // 既存の目標値を保持（自動計算削除）
          const currentCalories = latestProfile?.targetCalories || finalCalories;
          const currentMacros = latestProfile?.macros || { protein: finalProtein, fat: finalFat, carbs: finalCarbs };
          const currentBMR = latestProfile?.bmr || 1200;
          const currentTDEE = latestProfile?.tdee || currentCalories;
          
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
                activityLevel: 'moderate',
                primaryGoal: 'maintenance',
                // 既存値を保持
                targetCalories: currentCalories,
                bmr: currentBMR,
                tdee: currentTDEE,
                macros: currentMacros,
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
          
          // プロフィール履歴のみ保存（シンプル化）
          await profileHistoryPromise;

          console.log('✅ プロフィール編集: 保存完了');
          
          // プロフィール更新イベント発火
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('profileUpdated'));
          }
          
          // データを強制更新
          await Promise.all([
            refetchLatestProfile(),
            refetch() // カウンセリングデータも更新
          ]);
          
          // 保存完了 - 状態をリセット（既にモーダルは閉じている）
          setIsSaving(false);
          
          console.log('✅ バックグラウンド保存完了（楽観的更新）');
          
        } catch (error) {
          console.error('❌ プロフィール保存エラー:', error.message);
          
          // 🔄 エラー時：楽観的更新をロールバック
          setIsEditModalOpen(true); // モーダルを再表示
          setIsSaving(false);
          
          alert('保存に失敗しました。もう一度お試しください。');
        }
      }
      
    } catch (error) {
      console.error('プロフィール保存エラー:', error);
      alert('プロフィールの保存に失敗しました。再度お試しください。');
    }
  };






  // メニューアイテム - iOS設定風に整理（データページ削除済み）


  const accountMenuItems = [
    {
      label: 'リマインダー設定',
      color: '#8B5CF6',
      action: onNavigateToReminderSettings || (() => {})
    },
    {
      label: 'プラン・サブスクリプション',
      color: '#FBBF24',
      action: onNavigateToPlanSettings || (() => {})
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
    <div key={`${refreshKey}-${latestProfile?.changeDate || 'default'}`} className="space-y-8 pb-4">
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
            
          </div>

          {/* 健康指標と目標値 - 横並び（タップで編集） */}
          <div className="space-y-2">
            {/* 上段：体重関連 */}
            <div className="flex space-x-2">
              <button 
                onClick={handleOpenEditModal}
                className="flex-1 text-center p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="text-xs text-slate-500">体重</div>
                <div className="font-bold text-slate-900 text-sm">{userProfile.currentWeight ? `${userProfile.currentWeight}kg` : '-'}</div>
              </button>
              <button 
                onClick={handleOpenEditModal}
                className="flex-1 text-center p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="text-xs text-slate-500">目標</div>
                <div className="font-bold text-slate-900 text-sm">{userProfile.targetWeight ? `${userProfile.targetWeight}kg` : '-'}</div>
              </button>
            </div>
            
            {/* 下段：栄養目標 */}
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsTargetModalOpen(true)}
                className="flex-1 text-center p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="text-xs text-slate-500">カロリー</div>
                <div className="font-bold text-slate-900 text-sm">{finalCalories}</div>
              </button>
              <button 
                onClick={() => setIsTargetModalOpen(true)}
                className="flex-1 text-center p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="text-xs text-slate-500">P</div>
                <div className="font-bold text-red-600 text-sm">{finalProtein}g</div>
              </button>
              <button 
                onClick={() => setIsTargetModalOpen(true)}
                className="flex-1 text-center p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="text-xs text-slate-500">F</div>
                <div className="font-bold text-orange-600 text-sm">{finalFat}g</div>
              </button>
              <button 
                onClick={() => setIsTargetModalOpen(true)}
                className="flex-1 text-center p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="text-xs text-slate-500">C</div>
                <div className="font-bold text-green-600 text-sm">{finalCarbs}g</div>
              </button>
            </div>
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


          {/* ボタン */}
          <div className="flex space-x-2 pt-1">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1" size="sm">
                キャンセル
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50" 
              size="sm"
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 目標設定モーダル */}
      <TargetSettingsModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        selectedDate={new Date()}
        currentTargets={{
          targetCalories: finalCalories,
          protein: finalProtein,
          fat: finalFat,
          carbs: finalCarbs
        }}
        onSave={async () => {
          // 保存完了後に最新データを確実に取得
          await refetchLatestProfile();
          // 強制リフレッシュで確実に更新
          setRefreshKey(prev => prev + 1);
          // ページをリロードして確実に最新データを表示
          window.location.reload();
        }}
      />

    </div>
  );
}