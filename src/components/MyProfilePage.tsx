import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useCounselingData } from '@/hooks/useCounselingData';
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
  // 実際のユーザーデータを取得
  const { liffUser } = useAuth();
  const { counselingResult } = useCounselingData();
  
  // カウンセリング結果またはユーザープロフィールからデータを取得
  const userName = liffUser?.displayName || counselingResult?.answers?.name || counselingResult?.userProfile?.name || "ユーザー";
  const age = counselingResult?.answers?.age || counselingResult?.userProfile?.age || 0;
  const gender = counselingResult?.answers?.gender === 'male' ? '男性' : 
                 counselingResult?.answers?.gender === 'female' ? '女性' : 
                 counselingResult?.userProfile?.gender === 'male' ? '男性' : 
                 counselingResult?.userProfile?.gender === 'female' ? '女性' : 
                 counselingResult?.answers?.gender || counselingResult?.userProfile?.gender || '未設定';
  const height = counselingResult?.answers?.height || counselingResult?.userProfile?.height || 0;
  const currentWeight = counselingResult?.answers?.weight || counselingResult?.userProfile?.weight || 0;
  const targetWeight = counselingResult?.answers?.targetWeight || counselingResult?.userProfile?.targetWeight || 0;
  
  // カロリーとPFCデータの取得
  const dailyCalories = counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories || 0;
  const protein = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.protein || 0;
  const carbs = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.carbs || 0;
  const fat = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.fat || 0;
  
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
        <Card className="backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start p-0 h-auto hover:bg-slate-50/70 rounded-none"
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
    <div className="space-y-8 pb-4">
      {/* プロフィールヘッダー - iOS風アバター付き */}
      <div className="px-4">
        <Card className="backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/90 border border-white/60 rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            {/* ユーザー情報 */}
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900 mb-0.5">{userProfile.name}</h2>
              <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                <span>{userProfile.age}歳</span>
                <span>•</span>
                <span>{userProfile.gender}</span>
                <span>•</span>
                <span>{userProfile.height}cm</span>
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
            <div className="flex-1 text-center p-2.5 bg-white/60 rounded-lg">
              <div className="text-xs text-slate-500 mb-0.5">体重</div>
              <div className="font-bold text-slate-900">{userProfile.currentWeight}kg</div>
            </div>
            <div className="flex-1 text-center p-2.5 bg-white/60 rounded-lg">
              <div className="text-xs text-slate-500 mb-0.5">BMI</div>
              <div className="font-bold text-slate-900">{userProfile.bmi}</div>
            </div>
            <div className="flex-1 text-center p-2.5 bg-white/60 rounded-lg">
              <div className="text-xs text-slate-500 mb-0.5">目標</div>
              <div className="font-bold text-slate-900">{userProfile.targetWeight}kg</div>
            </div>
          </div>

          {/* 1日の目安 - カロリー・PFC */}
          {dailyCalories > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium text-slate-600">1日の目安</div>
              
              {/* カロリー */}
              <div className="text-center p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs text-blue-600 mb-0.5">摂取カロリー</div>
                <div className="font-bold text-blue-900">{dailyCalories}kcal</div>
              </div>
              
              {/* PFC */}
              <div className="flex space-x-1.5">
                <div className="flex-1 text-center p-2 bg-red-50 rounded border border-red-100">
                  <div className="text-xs text-red-600 mb-0.5">タンパク質</div>
                  <div className="font-bold text-red-900 text-sm">{protein}g</div>
                </div>
                <div className="flex-1 text-center p-2 bg-yellow-50 rounded border border-yellow-100">
                  <div className="text-xs text-yellow-600 mb-0.5">脂質</div>
                  <div className="font-bold text-yellow-900 text-sm">{fat}g</div>
                </div>
                <div className="flex-1 text-center p-2 bg-green-50 rounded border border-green-100">
                  <div className="text-xs text-green-600 mb-0.5">炭水化物</div>
                  <div className="font-bold text-green-900 text-sm">{carbs}g</div>
                </div>
              </div>
            </div>
          )}
          
          {/* カウンセリングやり直しボタン */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/counseling'}
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              カウンセリングをやり直す
            </Button>
          </div>
        </Card>
      </div>


      {/* アカウント・プラン */}
      {renderSection('アカウント・プラン', accountMenuItems)}

      {/* サポート */}
      {renderSection('サポート', supportMenuItems)}


    </div>
  );
}