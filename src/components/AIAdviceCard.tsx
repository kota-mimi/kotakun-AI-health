import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Stethoscope,
  ChevronRight,
  Utensils,
  Activity,
  Scale,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface CounselingResult {
  aiAnalysis: {
    personalizedAdvice: {
      advice: string;
    };
  };
}

interface AIAdviceCardProps {
  onNavigateToProfile?: () => void;
  onViewAllAdvices?: () => void;
  counselingResult?: CounselingResult | null;
}

export function AIAdviceCard({ onNavigateToProfile, onViewAllAdvices, counselingResult }: AIAdviceCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  // カウンセリング結果があれば個別アドバイスを使用、なければデフォルト
  const todayAdvice = counselingResult?.aiAnalysis?.personalizedAdvice?.advice ? {
    message: counselingResult.aiAnalysis.personalizedAdvice.advice,
    icon: Stethoscope,
    category: '個別アドバイス'
  } : {
    message: 'タンパク質が不足しています。夕食で魚や鶏肉を追加しましょう。',
    icon: Utensils,
    category: '栄養バランス'
  };

  const Icon = todayAdvice.icon;

  return (
    <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-500/10 overflow-hidden">
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        variant="ghost"
        className="w-full justify-start p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900">AIアドバイス</h3>
          </div>
          {isCollapsed ? (
            <ChevronDown size={16} className="text-slate-500" />
          ) : (
            <ChevronUp size={16} className="text-slate-500" />
          )}
        </div>
      </Button>

      {!isCollapsed && (
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-health-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-health-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 mb-1">{todayAdvice.category}</div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {todayAdvice.message}
              </p>
            </div>
          </div>
          
          {onViewAllAdvices && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllAdvices}
                className="text-slate-500 hover:text-slate-700 p-1"
              >
                <span className="text-sm">全てのアドバイスを見る</span>
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}