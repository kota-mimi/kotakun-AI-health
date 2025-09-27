import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  X,
  Heart,
  Zap,
  Activity,
  Trophy,
  Clock,
  Flame,
  Plus,
  Timer,
  Target
} from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: {
    name: string;
    type: 'cardio' | 'strength' | 'flexibility' | 'sports';
    duration: number;
    calories: number;
    time: string;
    sets?: number;
    reps?: number;
    weight?: number;
    distance?: number;
    heartRate?: { avg: number; max: number };
    notes?: string;
  }) => void;
}

export function AddExerciseModal({ isOpen, onClose, onAddExercise }: AddExerciseModalProps) {
  const [exerciseType, setExerciseType] = useState<'cardio' | 'strength' | 'flexibility' | 'sports'>('cardio');
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    calories: '',
    time: '',
    sets: '',
    reps: '',
    weight: '',
    distance: '',
    avgHeartRate: '',
    maxHeartRate: '',
    notes: ''
  });

  if (!isOpen) return null;

  const exerciseTypes = [
    { value: 'cardio', label: '有酸素運動', icon: Heart, color: '#EF4444', examples: ['ランニング', 'サイクリング', 'ウォーキング', 'スイミング'] },
    { value: 'strength', label: '筋力トレーニング', icon: Zap, color: '#F59E0B', examples: ['ベンチプレス', 'スクワット', 'デッドリフト', '腕立て伏せ'] },
    { value: 'flexibility', label: '柔軟性・ストレッチ', icon: Activity, color: '#10B981', examples: ['ヨガ', 'ピラティス', 'ストレッチ', 'マッサージ'] },
    { value: 'sports', label: 'スポーツ・競技', icon: Trophy, color: '#8B5CF6', examples: ['テニス', 'バスケ', 'サッカー', 'バドミントン'] }
  ];

  const currentType = exerciseTypes.find(type => type.value === exerciseType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const exercise = {
      name: formData.name,
      type: exerciseType,
      duration: parseInt(formData.duration),
      calories: parseInt(formData.calories),
      time: formData.time,
      ...(exerciseType === 'strength' && {
        sets: parseInt(formData.sets) || undefined,
        reps: parseInt(formData.reps) || undefined,
        weight: parseFloat(formData.weight) || undefined
      }),
      ...(exerciseType === 'cardio' && {
        distance: parseFloat(formData.distance) || undefined
      }),
      ...(formData.avgHeartRate && formData.maxHeartRate && {
        heartRate: {
          avg: parseInt(formData.avgHeartRate),
          max: parseInt(formData.maxHeartRate)
        }
      }),
      notes: formData.notes || undefined
    };

    onAddExercise(exercise);
    onClose();
    
    // フォームリセット
    setFormData({
      name: '',
      duration: '',
      calories: '',
      time: '',
      sets: '',
      reps: '',
      weight: '',
      distance: '',
      avgHeartRate: '',
      maxHeartRate: '',
      notes: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectPresetExercise = (exercise: string) => {
    setFormData(prev => ({ ...prev, name: exercise }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="w-full max-w-sm bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-slate-800">運動を追加</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100"
          >
            <X size={20} className="text-slate-600" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* 運動タイプ選択 */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-3 block">運動タイプ</Label>
              <div className="grid grid-cols-2 gap-2">
                {exerciseTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setExerciseType(type.value as any)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        exerciseType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{backgroundColor: `${type.color}15`}}
                        >
                          <Icon size={16} style={{color: type.color}} />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{type.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 運動例 */}
            {currentType && (
              <div>
                <Label className="text-xs text-slate-600 mb-2 block">よく選ばれる運動</Label>
                <div className="flex flex-wrap gap-2">
                  {currentType.examples.map((exercise) => (
                    <button
                      key={exercise}
                      type="button"
                      onClick={() => selectPresetExercise(exercise)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-full transition-colors"
                    >
                      {exercise}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 運動名 */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">運動名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="例: ランニング"
                required
                className="mt-1"
              />
            </div>

            {/* 基本情報 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-slate-700">時間（分）</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="30"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-sm font-medium text-slate-700">開始時間</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {/* 筋トレ専用フィールド */}
            {exerciseType === 'strength' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="sets" className="text-sm font-medium text-slate-700">セット数</Label>
                  <Input
                    id="sets"
                    type="number"
                    value={formData.sets}
                    onChange={(e) => handleInputChange('sets', e.target.value)}
                    placeholder="3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reps" className="text-sm font-medium text-slate-700">回数</Label>
                  <Input
                    id="reps"
                    type="number"
                    value={formData.reps}
                    onChange={(e) => handleInputChange('reps', e.target.value)}
                    placeholder="12"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-sm font-medium text-slate-700">重量（kg）</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.5"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="50"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* 有酸素運動専用フィールド */}
            {exerciseType === 'cardio' && (
              <div>
                <Label htmlFor="distance" className="text-sm font-medium text-slate-700">距離（km）</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  value={formData.distance}
                  onChange={(e) => handleInputChange('distance', e.target.value)}
                  placeholder="5.0"
                  className="mt-1"
                />
              </div>
            )}

            {/* 消費カロリー */}
            <div>
              <Label htmlFor="calories" className="text-sm font-medium text-slate-700">消費カロリー（kcal）</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => handleInputChange('calories', e.target.value)}
                placeholder="280"
                required
                className="mt-1"
              />
            </div>

            {/* 心拍数（オプション） */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">心拍数（オプション）</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="avgHeartRate" className="text-xs text-slate-600">平均心拍数</Label>
                  <Input
                    id="avgHeartRate"
                    type="number"
                    value={formData.avgHeartRate}
                    onChange={(e) => handleInputChange('avgHeartRate', e.target.value)}
                    placeholder="145"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxHeartRate" className="text-xs text-slate-600">最大心拍数</Label>
                  <Input
                    id="maxHeartRate"
                    type="number"
                    value={formData.maxHeartRate}
                    onChange={(e) => handleInputChange('maxHeartRate', e.target.value)}
                    placeholder="162"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* メモ */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-slate-700">メモ（オプション）</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="運動の感想や目標など..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* 送信ボタン */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="flex-1 text-white"
                style={{backgroundColor: '#4682B4'}}
                disabled={!formData.name || !formData.duration || !formData.time || !formData.calories}
              >
                <Plus size={16} className="mr-2" />
                追加
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}