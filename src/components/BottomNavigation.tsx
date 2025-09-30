import { Button } from './ui/button';
import { Home, Utensils, Scale, Dumbbell, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'home' | 'profile';
  onTabChange: (tab: 'home' | 'profile') => void;
}

// タブ定義：ホームと設定の2タブ構成
const tabs = [
  {
    id: 'home' as const,
    label: 'ホーム',
    icon: Home,
    description: 'メイン画面'
  },
  {
    id: 'profile' as const,
    label: 'マイページ',
    icon: User,
    description: 'プロフィール・設定'
  }
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full">
      <div className="backdrop-blur-xl bg-white/95 border-t border-slate-200/50 shadow-lg">
        {/* セーフエリア対応のパディング */}
        <div className="px-0 pt-2 pb-6">
          <div className="flex w-full">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => onTabChange(tab.id)}
                  className={`h-14 flex-1 flex flex-col items-center justify-center space-y-0.5 rounded-none transition-all duration-200 ${
                    isActive 
                      ? 'bg-health-primary/10 text-health-primary' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    <IconComponent size={18} />
                  </div>
                  <span className={`text-xs transition-all duration-200 ${
                    isActive ? 'font-semibold' : 'font-medium'
                  }`}>
                    {tab.label}
                  </span>
                  
                  {/* アクティブインジケーター */}
                  {isActive && (
                    <div className="w-1 h-1 bg-health-primary rounded-full mt-0.5"></div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}