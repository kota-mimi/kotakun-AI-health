import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
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
  onNavigateToDataManagement?: () => void;
}

export function MyProfilePage({ 
  onNavigateToSettings, 
  onNavigateToData,
  onNavigateToPlanSettings,
  onNavigateToPaymentSettings,
  onNavigateToUserGuide,
  onNavigateToContact,
  onNavigateToDataManagement
}: MyProfilePageProps) {
  // ユーザープロフィールデータ（モック）
  const userProfile = {
    name: "田中 太郎",
    age: 28,
    gender: "男性",
    height: 175, // cm
    currentWeight: 72.5, // kg
    targetWeight: 68.0, // kg
    targetDate: "2025年4月",
    bmi: 23.7,
    joinDate: "2024年1月"
  };





  // BMIステータス取得
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: '低体重', color: '#3B82F6' };
    if (bmi < 25) return { status: '適正体重', color: '#10B981' };
    if (bmi < 30) return { status: '肥満（1度）', color: '#F59E0B' };
    return { status: '肥満（2度以上）', color: '#EF4444' };
  };

  const bmiStatus = getBMIStatus(userProfile.bmi);

  // メニューアイテム - iOS設定風に整理
  const healthMenuItems = [
    {
      icon: Scale,
      label: '体重記録',
      color: '#4682B4',
      action: () => onNavigateToData?.()
    },
    {
      icon: Utensils,
      label: '食事記録',
      color: '#10B981',
      action: () => onNavigateToData?.()
    },
    {
      icon: Activity,
      label: '運動記録',
      color: '#F59E0B',
      action: () => onNavigateToData?.()
    }
  ];

  const analysisMenuItems = [
    {
      icon: BarChart3,
      label: '統計・分析',
      color: '#4682B4',
      action: () => onNavigateToData?.()
    },
    {
      icon: MessageCircle,
      label: 'カウンセリング結果',
      color: '#8B5CF6',
      action: () => console.log('カウンセリング結果')
    },
    {
      icon: Brain,
      label: 'AIアドバイス履歴',
      color: '#06B6D4',
      action: () => console.log('AIアドバイス履歴')
    }
  ];

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

  const dataMenuItems = [
    {
      icon: BarChart3,
      label: 'データ管理・バックアップ',
      color: '#4682B4',
      action: onNavigateToDataManagement
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
        </Card>
      </div>

      {/* ヘルスケア */}
      {renderSection('ヘルスケア', healthMenuItems)}

      {/* 分析・レポート */}
      {renderSection('分析・レポート', analysisMenuItems)}

      {/* アカウント・プラン */}
      {renderSection('アカウント・プラン', accountMenuItems)}

      {/* サポート */}
      {renderSection('サポート', supportMenuItems)}

      {/* データ管理 */}
      {renderSection('データ管理', dataMenuItems)}
    </div>
  );
}