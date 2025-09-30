import React from 'react';
import { Button } from './ui/button';
import { X, Trash2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  time: string;
  distance?: number;
  sets?: { weight: number; reps: number; }[];
  calories?: number;
}

interface ExerciseDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exercise: Exercise | null;
}

export function ExerciseDeleteModal({ isOpen, onClose, onConfirm, exercise }: ExerciseDeleteModalProps) {
  if (!isOpen || !exercise) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">記録を削除</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100"
          >
            <X size={20} className="text-slate-600" />
          </Button>
        </div>
        
        {/* 内容 */}
        <div className="px-6 pb-6">
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="font-medium text-slate-900 mb-1">{exercise.name}</div>
            <div className="text-sm text-slate-600">
              {exercise.duration}分 • {exercise.time}
              {exercise.calories && ` • ${exercise.calories}kcal`}
            </div>
            {exercise.type === 'cardio' && exercise.distance && (
              <div className="text-sm text-blue-600 font-medium mt-1">
                距離: {exercise.distance}km
              </div>
            )}
            {exercise.type === 'strength' && exercise.sets && exercise.sets.length > 0 && (
              <div className="mt-2 space-y-1">
                {exercise.sets.map((set, index) => (
                  <div key={index} className="text-sm text-orange-600 font-medium">
                    セット{index + 1}: {set.weight}kg × {set.reps}回
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-slate-600 text-sm mb-6">
            この運動記録を削除してもよろしいですか？<br />
            削除した記録は元に戻せません。
          </p>
          
          {/* ボタン */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              削除する
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}