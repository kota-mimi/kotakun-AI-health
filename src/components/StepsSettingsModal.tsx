import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { 
  Target, 
  Footprints, 
  MapPin, 
  Clock,
  Zap,
  User,
  Save
} from 'lucide-react';

interface StepsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: StepsSettings) => void;
}

interface StepsSettings {
  dailyStepsTarget: number;
  dailyDistanceTarget: number;
  weight: number;
  height: number;
  age: number;
}

export function StepsSettingsModal({ isOpen, onClose, onSave }: StepsSettingsModalProps) {
  const [settings, setSettings] = useState<StepsSettings>({
    dailyStepsTarget: 10000,
    dailyDistanceTarget: 7.0,
    weight: 70,
    height: 170,
    age: 30
  });

  // 目標設定のプリセット
  const stepPresets = [
    { steps: 6000, label: '軽い運動', description: '日常生活レベル' },
    { steps: 8000, label: '健康維持', description: '健康的な生活' },
    { steps: 10000, label: '標準目標', description: '推奨される目標' },
    { steps: 12000, label: 'アクティブ', description: '活動的な生活' },
    { steps: 15000, label: '高い目標', description: 'スポーツ愛好者' }
  ];

  // 消費カロリー計算（簡易計算）
  const calculateCaloriesPerStep = () => {
    // 体重 × 0.04 ÷ 歩数 の概算
    return (settings.weight * 0.04) / 1000;
  };

  const estimatedCalories = Math.round(settings.dailyStepsTarget * calculateCaloriesPerStep());
  const estimatedTime = Math.round(settings.dailyStepsTarget / 120); // 1分間約120歩

  const handleStepsTargetChange = (value: number[]) => {
    const steps = value[0];
    setSettings(prev => ({
      ...prev,
      dailyStepsTarget: steps,
      dailyDistanceTarget: Number((steps * 0.0007).toFixed(1)) // 1歩約0.7m
    }));
  };

  const handlePresetSelect = (preset: typeof stepPresets[0]) => {
    setSettings(prev => ({
      ...prev,
      dailyStepsTarget: preset.steps,
      dailyDistanceTarget: Number((preset.steps * 0.0007).toFixed(1))
    }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full mx-4 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Footprints size={20} style={{color: '#22C55E'}} />
            <span>歩数・徒歩設定</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 目標歩数設定 */}
          <Card className="p-4 bg-white/60 border border-white/40">
            <div className="flex items-center space-x-2 mb-4">
              <Target size={16} style={{color: '#3B82F6'}} />
              <h4 className="font-medium text-slate-800">1日の目標歩数</h4>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-slate-800">
                {settings.dailyStepsTarget.toLocaleString()}
                <span className="text-sm font-normal text-slate-600 ml-1">歩</span>
              </div>
            </div>

            <Slider
              value={[settings.dailyStepsTarget]}
              onValueChange={handleStepsTargetChange}
              max={20000}
              min={3000}
              step={500}
              className="mb-4"
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-white/50 rounded">
                <div className="text-xs text-slate-500">推定距離</div>
                <div className="text-sm font-semibold text-slate-800">{settings.dailyDistanceTarget}km</div>
              </div>
              <div className="text-center p-2 bg-white/50 rounded">
                <div className="text-xs text-slate-500">推定時間</div>
                <div className="text-sm font-semibold text-slate-800">{estimatedTime}分</div>
              </div>
            </div>
          </Card>

          {/* プリセット選択 */}
          <Card className="p-4 bg-white/60 border border-white/40">
            <h4 className="font-medium text-slate-800 mb-3">目標プリセット</h4>
            <div className="space-y-2">
              {stepPresets.map((preset) => (
                <Button
                  key={preset.steps}
                  variant={settings.dailyStepsTarget === preset.steps ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  className={`w-full justify-between text-left p-3 h-auto ${
                    settings.dailyStepsTarget === preset.steps 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'hover:bg-white/60'
                  }`}
                >
                  <div>
                    <div className="font-medium">{preset.label}</div>
                    <div className={`text-xs ${
                      settings.dailyStepsTarget === preset.steps ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {preset.description}
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${
                    settings.dailyStepsTarget === preset.steps ? 'bg-white/20 text-white' : ''
                  }`}>
                    {preset.steps.toLocaleString()}歩
                  </Badge>
                </Button>
              ))}
            </div>
          </Card>

          {/* 個人情報設定 */}
          <Card className="p-4 bg-white/60 border border-white/40">
            <div className="flex items-center space-x-2 mb-3">
              <User size={16} style={{color: '#8B5CF6'}} />
              <h4 className="font-medium text-slate-800">個人情報（消費カロリー計算用）</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <label className="text-xs text-slate-600 mb-1 block">体重</label>
                <div className="text-sm font-semibold text-slate-800">{settings.weight}kg</div>
              </div>
              <div className="text-center">
                <label className="text-xs text-slate-600 mb-1 block">身長</label>
                <div className="text-sm font-semibold text-slate-800">{settings.height}cm</div>
              </div>
              <div className="text-center">
                <label className="text-xs text-slate-600 mb-1 block">年齢</label>
                <div className="text-sm font-semibold text-slate-800">{settings.age}歳</div>
              </div>
            </div>

            <div className="mt-3 p-2 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-xs text-green-700">
                <Zap size={12} />
                <span>推定消費カロリー: {estimatedCalories}kcal/日</span>
              </div>
            </div>
          </Card>

          {/* 保存ボタン */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <Save size={16} className="mr-1" />
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}