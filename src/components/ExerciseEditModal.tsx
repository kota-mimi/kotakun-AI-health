import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { NumberPickerModal } from './NumberPickerModal';

interface ExerciseSet {
  weight: number;
  reps: number;
}

interface Exercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  time: string;
  distance?: number;
  sets?: ExerciseSet[];
  calories?: number;
}

interface ExerciseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (exerciseId: string, updates: Partial<Exercise>) => void;
  onDelete: (exerciseId: string) => void;
  exercise: Exercise | null;
  userWeight?: number;
}

export function ExerciseEditModal({ isOpen, onClose, onUpdate, onDelete, exercise, userWeight = 70 }: ExerciseEditModalProps) {
  const [duration, setDuration] = useState(30);
  const [distance, setDistance] = useState(0);
  const [sets, setSets] = useState<ExerciseSet[]>([{ weight: 0, reps: 0 }]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({ min: 0, max: 100, value: 0, step: 1, unit: '', title: '' });
  const [pickerType, setPickerType] = useState<'duration' | 'distance' | 'weight' | 'reps'>('duration');
  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  useEffect(() => {
    if (exercise) {
      setDuration(exercise.duration);
      setDistance(exercise.distance || 0);
      setSets(exercise.sets || [{ weight: 0, reps: 0 }]);
    }
  }, [exercise]);

  if (!isOpen || !exercise) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUpdate = () => {
    // カロリー計算（体重を70kgと仮定、実際の計算式）
    const calculateCalories = () => {
      // propsから受け取った体重を使用
      
      if (exercise.type === 'cardio') {
        // 有酸素運動：METs値 × 体重(kg) × 時間(時) × 1.05
        const mets = exercise.name === 'ランニング' ? 8.0 : 
                    exercise.name === 'ウォーキング' ? 3.5 : 6.0;
        return Math.round(mets * userWeight * (duration / 60) * 1.05);
      } else if (exercise.type === 'strength') {
        // 筋トレ：METs値 × 体重(kg) × 時間(時) × 1.05
        const mets = 6.0; // 筋力トレーニングの平均METs値
        return Math.round(mets * userWeight * (duration / 60) * 1.05);
      } else {
        // その他の運動
        const mets = 4.0;
        return Math.round(mets * userWeight * (duration / 60) * 1.05);
      }
    };

    const updates: Partial<Exercise> = {
      duration,
      calories: calculateCalories()
    };

    if (exercise.type === 'cardio') {
      updates.distance = distance;
    }

    if (exercise.type === 'strength') {
      updates.sets = sets.filter(set => set.weight > 0 && set.reps > 0);
    }

    onUpdate(exercise.id, updates);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`${exercise.name}の記録を削除してもよろしいですか？`)) {
      onDelete(exercise.id);
      onClose();
    }
  };

  const addSet = () => {
    setSets([...sets, { weight: 0, reps: 0 }]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: keyof ExerciseSet, value: number) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  // ピッカー開く
  const openPicker = (type: 'duration' | 'distance' | 'weight' | 'reps', setIndex?: number) => {
    let config = { min: 0, max: 100, value: 0, step: 1, unit: '', title: '' };
    
    switch (type) {
      case 'duration':
        config = {
          min: 1,
          max: 180,
          value: duration,
          step: 1,
          unit: '分',
          title: '運動時間'
        };
        break;
      case 'distance':
        config = {
          min: 0,
          max: 50,
          value: distance,
          step: 0.5,
          unit: 'km',
          title: '距離'
        };
        break;
      case 'weight':
        config = {
          min: 0,
          max: 200,
          value: setIndex !== undefined ? sets[setIndex]?.weight || 0 : 0,
          step: 0.5,
          unit: 'kg',
          title: '重量'
        };
        break;
      case 'reps':
        config = {
          min: 1,
          max: 100,
          value: setIndex !== undefined ? sets[setIndex]?.reps || 0 : 0,
          step: 1,
          unit: '回',
          title: '回数'
        };
        break;
    }
    
    setPickerConfig(config);
    setPickerType(type);
    if (setIndex !== undefined) {
      setCurrentSetIndex(setIndex);
    }
    setIsPickerOpen(true);
  };

  const handlePickerConfirm = (value: number) => {
    switch (pickerType) {
      case 'duration':
        setDuration(value);
        break;
      case 'distance':
        setDistance(value);
        break;
      case 'weight':
        updateSet(currentSetIndex, 'weight', value);
        break;
      case 'reps':
        updateSet(currentSetIndex, 'reps', value);
        break;
    }
    setIsPickerOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{exercise.name}</h3>
            <div className="text-xs text-slate-600">
              {exercise.type === 'cardio' ? '有酸素' : 
               exercise.type === 'strength' ? '筋トレ' :
               exercise.type === 'flexibility' ? 'ストレッチ' : 'スポーツ'} • {exercise.time}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={18} className="text-slate-600" />
          </Button>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 運動時間と距離 */}
          {exercise.type === 'cardio' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-700 text-xs">運動時間</Label>
                <button
                  type="button"
                  onClick={() => openPicker('duration')}
                  className="w-full py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors mt-1"
                >
                  <span className="text-sm font-medium text-slate-800">{duration}分</span>
                </button>
              </div>
              <div>
                <Label className="text-slate-700 text-xs">距離</Label>
                <button
                  type="button"
                  onClick={() => openPicker('distance')}
                  className="w-full py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors mt-1"
                >
                  <span className="text-sm font-medium text-slate-800">{distance}km</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-20">
              <Label className="text-slate-700 text-xs">運動時間</Label>
              <button
                type="button"
                onClick={() => openPicker('duration')}
                className="w-full py-1 px-2 bg-slate-50 rounded border border-slate-200 hover:border-blue-400 transition-colors mt-1"
              >
                <span className="text-xs font-medium text-slate-800">{duration}分</span>
              </button>
            </div>
          )}

          {/* セット情報（筋トレの場合） */}
          {exercise.type === 'strength' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 text-xs">セット情報</Label>
                <button
                  type="button"
                  onClick={addSet}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + 追加
                </button>
              </div>
              
              <div className="space-y-1">
                {sets.map((set, index) => (
                  <div key={index} className="bg-slate-50 rounded p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 w-8">#{index + 1}</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={set.weight || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          updateSet(index, 'weight', Math.max(0, Math.min(200, value)));
                        }}
                        className="text-center text-xs h-7 flex-1"
                        style={{ fontSize: '16px' }}
                      />
                      <span className="text-xs text-slate-500">kg</span>
                      <span className="text-xs text-slate-400">×</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={set.reps || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          updateSet(index, 'reps', Math.max(0, Math.min(100, value)));
                        }}
                        className="text-center text-xs h-7 flex-1"
                        style={{ fontSize: '16px' }}
                      />
                      <span className="text-xs text-slate-500">回</span>
                      {sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSet(index)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Minus size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleUpdate}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              更新する
            </Button>
            
            <Button
              onClick={handleDelete}
              variant="outline"
              className="w-full py-2 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm"
            >
              <Trash2 size={14} className="mr-1" />
              削除する
            </Button>
          </div>
        </div>
      </div>

      {/* NumberPickerModal */}
      <NumberPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handlePickerConfirm}
        min={pickerConfig.min}
        max={pickerConfig.max}
        value={pickerConfig.value}
        step={pickerConfig.step}
        unit={pickerConfig.unit}
        title={pickerConfig.title}
      />
    </div>
  );
}