import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { X, Edit, Copy, Heart, Zap, Activity, Trophy, Clock, Flame, Target, Route } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  calories: number;
  sets?: { weight: number; reps: number; }[];
  distance?: number;
  time: string;
  notes?: string;
}

interface ExerciseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onEdit: () => void;
  onCopy: () => void;
}

export function ExerciseDetailModal({ 
  isOpen, 
  onClose, 
  exercise, 
  onEdit, 
  onCopy 
}: ExerciseDetailModalProps) {
  if (!isOpen || !exercise) return null;

  const getExerciseTypeIcon = (type: Exercise['type']) => {
    switch (type) {
      case 'cardio':
        return <Heart size={20} style={{color: '#EF4444'}} />;
      case 'strength':
        return <Zap size={20} style={{color: '#F59E0B'}} />;
      case 'flexibility':
        return <Activity size={20} style={{color: '#10B981'}} />;
      case 'sports':
        return <Trophy size={20} style={{color: '#8B5CF6'}} />;
      default:
        return <Activity size={20} style={{color: '#4682B4'}} />;
    }
  };

  const getExerciseTypeName = (type: Exercise['type']) => {
    switch (type) {
      case 'cardio': return '有酸素運動';
      case 'strength': return '筋力トレーニング';
      case 'flexibility': return 'ストレッチ';
      case 'sports': return 'スポーツ';
      default: return '運動';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`;
    }
    return `${minutes}分`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ */}
      <div className="relative w-full max-w-sm bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                {getExerciseTypeIcon(exercise.type)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{exercise.name}</h2>
                <Badge variant="secondary" className="mt-1">
                  {getExerciseTypeName(exercise.type)}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* 実施時間 */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
            <div className="flex items-center space-x-2 mb-2">
              <Clock size={16} style={{color: '#4682B4'}} />
              <span className="text-sm font-medium text-slate-700">実施時間</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{exercise.time}</div>
          </Card>

          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 運動時間 */}
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Clock size={14} style={{color: '#4682B4'}} />
                <span className="text-xs text-slate-600">運動時間</span>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatDuration(exercise.duration)}
              </div>
            </Card>

            {/* 消費カロリー */}
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Flame size={14} style={{color: '#EF4444'}} />
                <span className="text-xs text-slate-600">消費カロリー</span>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {exercise.calories}kcal
              </div>
            </Card>
          </div>

          {/* 有酸素運動の詳細（距離） */}
          {exercise.type === 'cardio' && exercise.distance && (
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Route size={16} style={{color: '#10B981'}} />
                <span className="text-sm font-medium text-slate-700">運動詳細</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-600 mb-1">距離</div>
                  <div className="text-xl font-bold text-slate-800">{exercise.distance}km</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-600 mb-1">平均ペース</div>
                  <div className="text-xl font-bold text-slate-800">
                    {(exercise.duration / exercise.distance).toFixed(1)}分/km
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 筋トレの詳細（セット） */}
          {exercise.type === 'strength' && exercise.sets && exercise.sets.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Zap size={16} style={{color: '#F59E0B'}} />
                <span className="text-sm font-medium text-slate-700">セット詳細</span>
              </div>
              <div className="space-y-2">
                {exercise.sets.map((set, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">セット {index + 1}</span>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-xs text-slate-600">重量</div>
                        <div className="text-sm font-bold text-slate-800">{set.weight}kg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-600">回数</div>
                        <div className="text-sm font-bold text-slate-800">{set.reps}回</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xs text-slate-600">総セット数</div>
                      <div className="text-lg font-bold text-slate-800">{exercise.sets.length}set</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">最大重量</div>
                      <div className="text-lg font-bold text-slate-800">
                        {Math.max(...exercise.sets.map(s => s.weight))}kg
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* メモ */}
          {exercise.notes && (
            <Card className="p-4">
              <div className="text-sm font-medium text-slate-700 mb-2">メモ</div>
              <div className="text-sm text-slate-600 leading-relaxed">
                {exercise.notes}
              </div>
            </Card>
          )}

          {/* アクションボタン */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onEdit}
              className="w-full"
            >
              <Edit size={16} className="mr-2" />
              編集
            </Button>
            <Button 
              variant="outline" 
              onClick={onCopy}
              className="w-full"
            >
              <Copy size={16} className="mr-2" />
              複製
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}