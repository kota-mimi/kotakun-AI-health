import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Trash2 } from 'lucide-react';
import { NumberPickerModal } from './NumberPickerModal';

interface ExerciseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; duration: number; calories: number; reps?: number; weight?: number; setsCount?: number }) => void;
  userWeight: number;
}

interface ExerciseType {
  id: string;
  name: string;
  icon: string;
  mets: number; // METs値（運動強度）
}

interface StrengthExercise {
  id: string;
  name: string;
  category: string;
  mets: number;
}

interface ExerciseSet {
  weight: number;
  reps: number;
}

const exerciseTypes: ExerciseType[] = [
  { id: 'walking', name: 'ウォーキング', icon: '', mets: 3.5 },
  { id: 'running', name: 'ランニング', icon: '', mets: 8.0 },
  { id: 'strength', name: '筋トレ', icon: '', mets: 5.0 },
  { id: 'other', name: 'その他', icon: '', mets: 4.0 }
];

const strengthExercises: StrengthExercise[] = [
  { id: 'bench_press', name: 'ベンチプレス', category: '胸', mets: 6.0 },
  { id: 'squats', name: 'スクワット', category: '脚', mets: 5.0 },
  { id: 'deadlift', name: 'デッドリフト', category: '脚', mets: 7.0 }
];

const addNewExerciseOption: StrengthExercise = { id: 'add_new', name: '新しい種目を追加', category: '追加', mets: 5.0 };

export function ExerciseEntryModal({ isOpen, onClose, onSubmit, userWeight }: ExerciseEntryModalProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [selectedStrengthExercise, setSelectedStrengthExercise] = useState<StrengthExercise | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [sets, setSets] = useState<ExerciseSet[]>([{ weight: 0, reps: 0 }]);
  const [isStrengthDropdownOpen, setIsStrengthDropdownOpen] = useState(false);
  const [customStrengthExercises, setCustomStrengthExercises] = useState<StrengthExercise[]>([]);
  const [customOtherExercises, setCustomOtherExercises] = useState<ExerciseType[]>([]);
  const [customOtherExerciseName, setCustomOtherExerciseName] = useState('');
  
  // localStorageから保存されたカスタム種目を読み込み
  useEffect(() => {
    const savedStrengthExercises = localStorage.getItem('customStrengthExercises');
    const savedOtherExercises = localStorage.getItem('customOtherExercises');
    
    if (savedStrengthExercises) {
      try {
        setCustomStrengthExercises(JSON.parse(savedStrengthExercises));
      } catch (error) {
        console.error('筋トレ種目の読み込みエラー:', error);
      }
    }
    
    if (savedOtherExercises) {
      try {
        setCustomOtherExercises(JSON.parse(savedOtherExercises));
      } catch (error) {
        console.error('その他運動の読み込みエラー:', error);
      }
    }
  }, []);
  
  // カスタム筋トレ種目をlocalStorageに保存
  const saveCustomStrengthExercises = (exercises: StrengthExercise[]) => {
    try {
      localStorage.setItem('customStrengthExercises', JSON.stringify(exercises));
      setCustomStrengthExercises(exercises);
    } catch (error) {
      console.error('筋トレ種目の保存エラー:', error);
    }
  };
  
  // カスタムその他運動をlocalStorageに保存
  const saveCustomOtherExercises = (exercises: ExerciseType[]) => {
    try {
      localStorage.setItem('customOtherExercises', JSON.stringify(exercises));
      setCustomOtherExercises(exercises);
    } catch (error) {
      console.error('その他運動の保存エラー:', error);
    }
  };
  
  // ピッカーモーダル状態
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    type: 'duration' | 'distance' | 'weight' | 'reps';
    title: string;
    min: number;
    max: number;
    value: number;
    step: number;
    unit: string;
    setIndex?: number;
  }>({
    isOpen: false,
    type: 'duration',
    title: '',
    min: 0,
    max: 100,
    value: 0,
    step: 1,
    unit: ''
  });

  // 全ての筋トレ種目（デフォルト + カスタム + 追加オプション）
  const allStrengthExercises = [...strengthExercises, ...customStrengthExercises, addNewExerciseOption];
  
  // 新しい筋トレ種目を追加する処理
  const handleAddNewExercise = (exerciseName: string, category: string) => {
    const newExercise: StrengthExercise = {
      id: `custom_${Date.now()}`,
      name: exerciseName,
      category: category,
      mets: 5.0
    };
    const updatedExercises = [...customStrengthExercises, newExercise];
    saveCustomStrengthExercises(updatedExercises);
    setSelectedStrengthExercise(newExercise);
    setCustomExerciseName('');
    setIsStrengthDropdownOpen(false);
  };
  
  // 筋トレ種目を削除する処理
  const handleDeleteStrengthExercise = (exerciseId: string) => {
    const updatedExercises = customStrengthExercises.filter(ex => ex.id !== exerciseId);
    saveCustomStrengthExercises(updatedExercises);
    
    // 削除した種目が選択されていた場合はリセット
    if (selectedStrengthExercise?.id === exerciseId) {
      setSelectedStrengthExercise(null);
    }
  };

  // 新しいその他運動を追加する処理
  const handleAddNewOtherExercise = (exerciseName: string, mets: number) => {
    const newExercise: ExerciseType = {
      id: `custom_other_${Date.now()}`,
      name: exerciseName,
      icon: '',
      mets: mets
    };
    const updatedExercises = [...customOtherExercises, newExercise];
    saveCustomOtherExercises(updatedExercises);
    setSelectedExercise(newExercise);
    setCustomOtherExerciseName('');
  };
  
  // その他運動を削除する処理
  const handleDeleteOtherExercise = (exerciseId: string) => {
    const updatedExercises = customOtherExercises.filter(ex => ex.id !== exerciseId);
    saveCustomOtherExercises(updatedExercises);
    
    // 削除した運動が選択されていた場合はリセット
    if (selectedExercise?.id === exerciseId) {
      setSelectedExercise(null);
    }
  };

  if (!isOpen) return null;

  // カロリー計算：METs × 体重(kg) × 時間(h) × 1.05 または 距離ベース計算 または 筋トレセット計算
  const calculateCalories = (exercise: ExerciseType, weightKg: number, durationMin: number, distanceKm?: number, strengthExercise?: StrengthExercise, exerciseSets?: ExerciseSet[]) => {
    // 筋トレの場合のセットベース計算
    if (exercise.id === 'strength' && exerciseSets && exerciseSets.length > 0) {
      // セット数とレップ数、重量を考慮した計算
      const totalVolume = exerciseSets.reduce((sum, set) => {
        if (set.weight > 0 && set.reps > 0) {
          return sum + (set.weight * set.reps);
        }
        return sum;
      }, 0);
      
      const totalReps = exerciseSets.reduce((sum, set) => sum + (set.reps > 0 ? set.reps : 0), 0);
      
      // 時間ベースと回数ベースの計算を使い分け
      if (durationMin > 0) {
        // 時間ベース計算
        const hours = durationMin / 60;
        const metsValue = strengthExercise ? strengthExercise.mets : 5.0;
        const basicalCalories = Math.round(metsValue * weightKg * hours * 1.05);
        const volumeBonus = Math.round(totalVolume * 0.02);
        return basicalCalories + volumeBonus;
      } else if (totalReps > 0) {
        // 回数ベース計算（時間が0分の場合）
        let baseCaloriesPerRep = 2;
        if (strengthExercise) {
          if (strengthExercise.name.includes('腕立て') || strengthExercise.name.includes('プッシュアップ')) {
            baseCaloriesPerRep = 2.5;
          } else if (strengthExercise.name.includes('腹筋')) {
            baseCaloriesPerRep = 1.5;
          } else if (strengthExercise.name.includes('スクワット')) {
            baseCaloriesPerRep = 3.0;
          } else if (strengthExercise.name.includes('プレス') || strengthExercise.name.includes('ベンチ')) {
            baseCaloriesPerRep = 4.0;
          }
        }
        const weightMultiplier = totalVolume > 0 ? 1 + (totalVolume / 1000) : 1;
        return Math.round(baseCaloriesPerRep * totalReps * weightMultiplier);
      }
      
      return 50; // デフォルト値
    }
    
    // ランニング・ウォーキングで距離が入力されている場合は距離ベース計算
    if ((exercise.id === 'running' || exercise.id === 'walking') && distanceKm && distanceKm > 0) {
      // 距離ベース: ウォーキング 50kcal/km、ランニング 60kcal/km (体重70kg基準)
      const caloriesPerKm = exercise.id === 'running' ? 60 : 50;
      const weightFactor = weightKg / 70; // 体重補正
      return Math.round(distanceKm * caloriesPerKm * weightFactor);
    }
    
    // 時間ベース計算（従来通り）
    const hours = durationMin / 60;
    const metsValue = exercise.id === 'strength' ? 5.0 : exercise.mets; // 筋トレはデフォルト5.0
    return Math.round(metsValue * weightKg * hours * 1.05);
  };

  const estimatedCalories = selectedExercise 
    ? calculateCalories(
        selectedExercise, 
        userWeight, 
        duration || 0, 
        distance || undefined,
        selectedStrengthExercise || undefined,
        selectedExercise.id === 'strength' ? sets : undefined
      )
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExercise) {
      alert('運動の種類と時間を入力してください');
      return;
    }

    // 筋トレの場合の追加チェック
    if (selectedExercise.id === 'strength') {
      if (!selectedStrengthExercise) {
        alert('筋トレの種目を選択してください');
        return;
      }
      if (selectedStrengthExercise.id === 'add_new') {
        alert('種目を追加してから記録してください');
        return;
      }
    }

    // 運動名を決定
    let exerciseName = selectedExercise.name;
    if (selectedExercise.id === 'strength') {
      exerciseName = selectedStrengthExercise?.name || selectedExercise.name;
    }

    // 運動タイプを決定
    let exerciseType: 'cardio' | 'strength' | 'flexibility' | 'sports' = 'cardio';
    if (selectedExercise.id === 'strength') {
      exerciseType = 'strength';
    } else if (selectedExercise.id === 'ランニング' || selectedExercise.id === 'ウォーキング') {
      exerciseType = 'cardio';
    }

    const exerciseData: any = {
      name: exerciseName,
      type: exerciseType,
      duration: duration,
      calories: estimatedCalories
    };

    // 有酸素運動の場合は距離を追加
    if (exerciseType === 'cardio' && distance > 0) {
      exerciseData.distance = distance;
    }

    // 筋トレの場合はセット情報を追加
    if (exerciseType === 'strength') {
      const validSets = sets.filter(set => set.weight > 0 && set.reps > 0);
      if (validSets.length > 0) {
        exerciseData.sets = validSets;
      } else {
        // 回数のみの記録の場合
        const totalReps = sets.reduce((sum, set) => sum + (set.reps > 0 ? set.reps : 0), 0);
        const totalWeight = sets.reduce((sum, set) => sum + (set.weight > 0 ? set.weight : 0), 0);
        if (totalReps > 0) {
          exerciseData.reps = totalReps;
          if (totalWeight > 0) exerciseData.weight = totalWeight;
          exerciseData.setsCount = sets.filter(set => set.reps > 0).length;
        }
      }
    }

    onSubmit(exerciseData);

    // フォームリセット
    setSelectedExercise(null);
    setSelectedStrengthExercise(null);
    setCustomExerciseName('');
    setCustomOtherExerciseName('');
    setDuration(0);
    setDistance(0);
    setSets([{ weight: 0, reps: 0 }]);
    setIsStrengthDropdownOpen(false);
    onClose();
  };

  // セット追加
  const addSet = () => {
    setSets([...sets, { weight: 0, reps: 0 }]);
  };

  // セット削除
  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  // セット更新
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
          max: 200,
          value: distance,
          step: 0.5,
          unit: 'km',
          title: '距離'
        };
        break;
      case 'weight':
        config = {
          min: 0,
          max: 500,
          value: setIndex !== undefined ? sets[setIndex].weight : 0,
          step: 2.5,
          unit: 'kg',
          title: '重量'
        };
        break;
      case 'reps':
        config = {
          min: 0,
          max: 1000,
          value: setIndex !== undefined ? sets[setIndex].reps : 0,
          step: 1,
          unit: '回',
          title: '回数'
        };
        break;
    }
    
    setPickerState({
      isOpen: true,
      type,
      setIndex,
      ...config
    });
  };
  
  // ピッカーから値確定
  const handlePickerConfirm = (value: number) => {
    switch (pickerState.type) {
      case 'duration':
        setDuration(value);
        break;
      case 'distance':
        setDistance(value);
        break;
      case 'weight':
        if (pickerState.setIndex !== undefined) {
          updateSet(pickerState.setIndex, 'weight', value);
        }
        break;
      case 'reps':
        if (pickerState.setIndex !== undefined) {
          updateSet(pickerState.setIndex, 'reps', value);
        }
        break;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
      hour12: false 
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl w-full mx-auto shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '360px',
          width: '85%',
          maxHeight: '85vh'
        }}
      >
        <div className="p-4 space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">運動を記録</h2>
            <p className="text-xs text-slate-600">{getCurrentTime()} - 今日</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={18} className="text-slate-600" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 運動選択 */}
          <div className="space-y-2">
            <Label className="text-slate-700 text-sm">運動の種類</Label>
            <div className="grid grid-cols-2 gap-2">
              {[...exerciseTypes, ...customOtherExercises].map((exercise) => (
                <div
                  key={exercise.id}
                  className={`relative p-3 rounded-lg border transition-all duration-200 ${
                    selectedExercise?.id === exercise.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedExercise(exercise)}
                    className="w-full text-left"
                  >
                    <div className="text-sm font-medium text-slate-800">{exercise.name}</div>
                  </button>
                  
                  {/* カスタム運動の削除ボタン */}
                  {exercise.id.startsWith('custom_other_') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`「${exercise.name}」を削除しますか？`)) {
                          handleDeleteOtherExercise(exercise.id);
                        }
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 時間入力 */}
          {selectedExercise && (
            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">運動時間</Label>
              <button
                type="button"
                onClick={() => openPicker('duration')}
                className="w-full py-3 px-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors"
              >
                <div className="text-xl font-semibold text-slate-800">
                  {duration}
                  <span className="text-base text-slate-500 ml-1">分</span>
                </div>
              </button>
            </div>
          )}

          {/* 距離入力（ウォーキング・ランニングのみ） */}
          {selectedExercise && (selectedExercise.id === 'walking' || selectedExercise.id === 'running') && (
            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">距離（任意）</Label>
              <button
                type="button"
                onClick={() => openPicker('distance')}
                className="w-full py-3 px-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors"
              >
                <div className="text-xl font-semibold text-slate-800">
                  {distance}
                  <span className="text-base text-slate-500 ml-1">km</span>
                </div>
              </button>
            </div>
          )}

          {/* 筋トレ種目選択 */}
          {selectedExercise && selectedExercise.id === 'strength' && (
            <div className="space-y-2">
              <Label className="text-slate-700 text-sm">筋トレ種目</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStrengthDropdownOpen(!isStrengthDropdownOpen)}
                  className="w-full py-3 px-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-base font-medium text-slate-800">
                      {selectedStrengthExercise ? selectedStrengthExercise.name : '種目を選択してください'}
                    </span>
                    {selectedStrengthExercise && (
                      <span className="ml-2 text-xs text-slate-500">({selectedStrengthExercise.category})</span>
                    )}
                  </div>
                  <svg 
                    className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                      isStrengthDropdownOpen ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* ドロップダウンリスト */}
                {isStrengthDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                    {allStrengthExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className={`relative flex items-center justify-between border-b border-slate-100 last:border-b-0 ${
                          selectedStrengthExercise?.id === exercise.id
                            ? 'bg-blue-50 text-blue-700'
                            : exercise.id === 'add_new'
                            ? 'text-green-700 hover:bg-green-50'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (exercise.id === 'add_new') {
                              setSelectedStrengthExercise(exercise);
                              setIsStrengthDropdownOpen(false);
                            } else {
                              setSelectedStrengthExercise(exercise);
                              setIsStrengthDropdownOpen(false);
                            }
                          }}
                          className="flex-1 p-3 text-left transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{exercise.name}</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                              {exercise.category}
                            </span>
                          </div>
                          <div className="flex-shrink-0">
                            {exercise.id === 'add_new' ? (
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            ) : selectedStrengthExercise?.id === exercise.id && (
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                        
                        {/* カスタム筋トレ種目の削除ボタン */}
                        {exercise.id.startsWith('custom_') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`「${exercise.name}」を削除しますか？`)) {
                                handleDeleteStrengthExercise(exercise.id);
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* カスタム種目名入力 */}
          {selectedExercise && selectedExercise.id === 'strength' && selectedStrengthExercise?.id === 'add_new' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <Label className="text-green-800 font-medium">新しい種目を追加</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-700 text-sm">種目名</Label>
                  <Input
                    type="text"
                    value={customExerciseName}
                    onChange={(e) => setCustomExerciseName(e.target.value)}
                    className="rounded-xl border border-slate-200 focus:border-green-400"
                    placeholder="例：ダンベルプレス"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 text-sm">部位</Label>
                  <select
                    value={customExerciseName ? '胸' : ''}
                    onChange={(e) => {
                      if (customExerciseName.trim()) {
                        handleAddNewExercise(customExerciseName.trim(), e.target.value);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:border-green-400 focus:outline-none"
                  >
                    <option value="">部位を選択</option>
                    <option value="胸">胸</option>
                    <option value="背中">背中</option>
                    <option value="脚">脚</option>
                    <option value="肩">肩</option>
                    <option value="腕">腕</option>
                    <option value="腹">腹</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (customExerciseName.trim()) {
                      handleAddNewExercise(customExerciseName.trim(), '胸');
                    }
                  }}
                  disabled={!customExerciseName.trim()}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50"
                >
                  種目を追加
                </Button>
              </div>
            </div>
          )}

          {/* その他運動の新規追加 */}
          {selectedExercise && selectedExercise.id === 'other' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <Label className="text-green-800 font-medium">新しい運動を追加</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-700 text-sm">運動名</Label>
                  <Input
                    type="text"
                    value={customOtherExerciseName}
                    onChange={(e) => setCustomOtherExerciseName(e.target.value)}
                    className="rounded-xl border border-slate-200 focus:border-green-400"
                    placeholder="例：ヨガ、水泳、サイクリング"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 text-sm">運動強度</Label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (customOtherExerciseName.trim() && e.target.value) {
                        handleAddNewOtherExercise(customOtherExerciseName.trim(), parseFloat(e.target.value));
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:border-green-400 focus:outline-none"
                  >
                    <option value="">強度を選択</option>
                    <option value="3.0">軽い（3.0 METs）</option>
                    <option value="5.0">普通（5.0 METs）</option>
                    <option value="7.0">激しい（7.0 METs）</option>
                  </select>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (customOtherExerciseName.trim()) {
                      handleAddNewOtherExercise(customOtherExerciseName.trim(), 5.0);
                    }
                  }}
                  disabled={!customOtherExerciseName.trim()}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50"
                >
                  運動を追加
                </Button>
              </div>
            </div>
          )}

          {/* セット・回数・重量入力 */}
          {selectedExercise && selectedExercise.id === 'strength' && selectedStrengthExercise && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">セット詳細</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSet}
                  className="text-xs border-blue-400 text-blue-600 hover:bg-blue-50"
                >
                  セット追加
                </Button>
              </div>
              
              <div className="space-y-3">
                {sets.map((set, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">セット {index + 1}</span>
                      {sets.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSet(index)}
                          className="p-1 text-red-500 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-slate-500 text-center mb-2">重量</div>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={set.weight || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateSet(index, 'weight', Math.max(0, Math.min(500, value)));
                            }}
                            className="w-full py-3 px-3 text-center text-lg font-semibold bg-white rounded-lg border border-slate-200 focus:border-blue-400"
                            placeholder="0"
                            style={{ fontSize: '16px' }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
                            kg
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-slate-500 text-center mb-2">回数</div>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={set.reps || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              updateSet(index, 'reps', Math.max(0, Math.min(1000, value)));
                            }}
                            className="w-full py-3 px-3 text-center text-lg font-semibold bg-white rounded-lg border border-slate-200 focus:border-blue-400"
                            placeholder="0"
                            style={{ fontSize: '16px' }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
                            回
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-slate-500 text-center">
                重量と回数を入力すると、より正確なカロリー計算ができます
              </div>
            </div>
          )}

          {/* 消費カロリー表示 */}
          {selectedExercise && (
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-600 mb-1">推定消費カロリー</div>
              <div className="text-xl font-bold text-blue-600">
                {estimatedCalories} <span className="text-base">kcal</span>
              </div>
              {(selectedExercise.id === 'walking' || selectedExercise.id === 'running') && parseFloat(distance) > 0 && (
                <div className="text-xs text-blue-500 mt-1">距離ベース計算</div>
              )}
              {selectedExercise.id === 'strength' && selectedStrengthExercise && sets.some(set => set.weight > 0 && set.reps > 0) && (
                <div className="text-xs text-blue-500 mt-1">
                  重量×回数ベース計算
                  <div className="mt-1">
                    総ボリューム: {sets.reduce((sum, set) => sum + (set.weight * set.reps), 0)}kg
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex space-x-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border-slate-200 hover:bg-slate-50 text-sm"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!selectedExercise}
              className="flex-1 py-2.5 rounded-lg text-white disabled:opacity-50 text-sm"
              style={{backgroundColor: '#3B82F6'}}
            >
              記録する
            </Button>
          </div>
        </form>
        </div>
      </div>
      
      {/* ナンバーピッカーモーダル */}
      <NumberPickerModal
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handlePickerConfirm}
        min={pickerState.min}
        max={pickerState.max}
        value={pickerState.value}
        step={pickerState.step}
        unit={pickerState.unit}
        title={pickerState.title}
      />
    </div>
  );
}