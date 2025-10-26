import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Target, 
  Calendar,
  Settings,
  Bell,
  Lock,
  HelpCircle,
  ChevronRight,
  Camera,
  Heart,
  FileText,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProfilePageProps {
  onNavigateToSettings?: () => void;
}

export function ProfilePage({ onNavigateToSettings }: ProfilePageProps) {
  const { isLiffReady, isLoggedIn, liffUser } = useAuth();
  const [userLevel] = useState(12);
  const [userXP] = useState(2480);
  const [nextLevelXP] = useState(3000);

  // LIFF認証完了まで待機（ちらつき防止）
  if (!isLiffReady || !isLoggedIn) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 shadow-xl border border-white/40 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-16 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  // 実際のLIFFユーザーデータを使用
  const userStats = {
    name: liffUser?.displayName || "ユーザー",
    age: null,
    joinDate: "アプリ開始"
  };

  const menuItems = [
    { icon: Target, label: "目標設定", color: "#4682B4", description: "カロリー・体重目標" },
    { icon: Calendar, label: "レポート", color: "#10B981", description: "週間・月間レポート" },
    { icon: Bell, label: "通知設定", color: "#F59E0B", description: "リマインダー設定" },
    { icon: Lock, label: "プライバシー", color: "#EF4444", description: "データ管理" },
    { icon: Settings, label: "アプリ設定", color: "#6B7280", description: "表示・操作設定" },
    { icon: HelpCircle, label: "ヘルプ", color: "#8B5CF6", description: "使い方・FAQ" }
  ];

  const legalMenuItems = [
    { icon: FileText, label: "利用規約", color: "#374151", description: "サービス利用条件", href: "/terms" },
    { icon: Shield, label: "プライバシーポリシー", color: "#374151", description: "個人情報保護方針", href: "/privacy" }
  ];

  return (
    <div className="space-y-4">
      {/* プロフィールヘッダー */}
      <Card className="backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 shadow-xl border border-white/40 rounded-2xl p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="w-20 h-20 ring-4 ring-white/50 shadow-lg">
              <AvatarImage src="https://images.unsplash.com/photo-1729559149720-2b6c5c200428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMG1hbiUyMGhlYWx0aHklMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NTY1NTQ3MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" />
              <AvatarFallback className="text-xl font-medium" style={{backgroundColor: '#4682B4', color: 'white'}}>
                {userStats.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-lg border-2 border-white hover:bg-gray-50"
            >
              <Camera size={14} className="text-gray-600" />
            </Button>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-800 mb-1">{userStats.name}</h2>
            <p className="text-sm text-slate-600 mb-2">{userStats.joinDate}から利用開始</p>
            
            {/* レベル・XP表示 */}
            <div className="bg-white/60 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{backgroundColor: '#4682B4'}}
                  >
                    {userLevel}
                  </div>
                  <span className="text-sm font-medium text-slate-700">レベル {userLevel}</span>
                </div>
                <span className="text-xs text-slate-500">{userXP}/{nextLevelXP} XP</span>
              </div>
              <Progress 
                value={(userXP / nextLevelXP) * 100} 
                className="h-2"
                style={{'--progress-background': '#4682B4'} as any}
              />
            </div>
          </div>
        </div>
      </Card>



      {/* 設定メニュー */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <h3 className="font-semibold text-slate-800 mb-4">設定</h3>
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start p-4 h-auto hover:bg-white/60 rounded-xl transition-all"
                onClick={item.label === 'アプリ設定' ? onNavigateToSettings : undefined}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{backgroundColor: `${item.color}15`}}
                  >
                    <Icon size={18} style={{color: item.color}} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* 法的情報 */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <h3 className="font-semibold text-slate-800 mb-4">法的情報</h3>
        <div className="space-y-1">
          {legalMenuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start p-4 h-auto hover:bg-white/60 rounded-xl transition-all"
                onClick={() => window.open(item.href, '_blank')}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{backgroundColor: `${item.color}15`}}
                  >
                    <Icon size={18} style={{color: item.color}} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* アプリ情報 */}
      <Card className="backdrop-blur-xl bg-white/60 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="text-center space-y-2">
          <div 
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center"
            style={{backgroundColor: '#4682B4'}}
          >
            <Heart size={24} className="text-white" />
          </div>
          <h4 className="font-semibold text-slate-800">LINE Health</h4>
          <p className="text-xs text-slate-500">バージョン 2.1.0</p>
          <p className="text-xs text-slate-400">© 2025 LINE Corporation</p>
        </div>
      </Card>
    </div>
  );
}