import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Stethoscope,
  ChevronRight,
  Utensils,
  Activity,
  Scale
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
    <Card className="backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-health-primary/10 rounded-lg flex items-center justify-center">
            <Stethoscope size={16} className="text-health-primary" />
          </div>
          <h3 className="font-semibold text-slate-800">AIアドバイス</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAllAdvices}
          className="text-slate-500 hover:text-slate-700 p-1"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

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
    </Card>
  );
}