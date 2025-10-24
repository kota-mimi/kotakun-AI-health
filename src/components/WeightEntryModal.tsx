import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X } from 'lucide-react';

interface WeightEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { weight?: number; bodyFat?: number; note?: string; photo?: string }) => void;
  currentWeight: number;
}

export function WeightEntryModal({ isOpen, onClose, onSubmit, currentWeight }: WeightEntryModalProps) {
  const [weight, setWeight] = useState(currentWeight > 0 ? currentWeight.toString() : '');
  const [bodyFat, setBodyFat] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState('');
  const [recordType, setRecordType] = useState<'both' | 'weight' | 'bodyFat'>('weight');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weightValue = weight ? parseFloat(weight) : undefined;
    const bodyFatValue = bodyFat ? parseFloat(bodyFat) : undefined;

    // 記録タイプに応じてバリデーション
    if (recordType === 'weight' || recordType === 'both') {
      if (!weight || isNaN(weightValue!) || weightValue! <= 0 || weightValue! > 300) {
        alert('正しい体重を入力してください（0-300kg）');
        return;
      }
    }

    if (recordType === 'bodyFat' || recordType === 'both') {
      if (!bodyFat || isNaN(bodyFatValue!) || bodyFatValue! < 0 || bodyFatValue! > 50) {
        alert('正しい体脂肪率を入力してください（0-50%）');
        return;
      }
    }

    // 少なくとも一つは入力が必要
    if (!weightValue && !bodyFatValue) {
      alert('体重または体脂肪率のいずれかを入力してください');
      return;
    }

    onSubmit({
      weight: weightValue,
      bodyFat: bodyFatValue,
      note: note.trim() || undefined,
      photo: photo || undefined
    });

    // フォームリセット
    setWeight(currentWeight > 0 ? currentWeight.toString() : '');
    setBodyFat('');
    setNote('');
    setPhoto('');
    setRecordType('weight');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const quickWeightAdjustments = [-0.5, -0.2, -0.1, 0.1, 0.2, 0.5];

  const adjustWeight = (adjustment: number) => {
    const currentValue = parseFloat(weight) || currentWeight;
    const newValue = Math.max(0, currentValue + adjustment);
    setWeight(newValue.toFixed(1));
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
      hour12: false 
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full mx-4 p-6 space-y-6 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">記録する</h2>
            <p className="text-sm text-slate-600">{getCurrentTime()} - 今日</p>
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

        {/* 記録タイプ選択 */}
        <div className="space-y-3">
          <Label className="text-slate-700">記録タイプ</Label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={recordType === 'weight' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecordType('weight')}
              className="flex-1 py-2 rounded-xl"
            >
              体重
            </Button>
            <Button
              type="button"
              variant={recordType === 'bodyFat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecordType('bodyFat')}
              className="flex-1 py-2 rounded-xl"
            >
              体脂肪
            </Button>
            <Button
              type="button"
              variant={recordType === 'both' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecordType('both')}
              className="flex-1 py-2 rounded-xl"
            >
              両方
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 体重入力 */}
          {(recordType === 'weight' || recordType === 'both') && (
            <div className="space-y-3">
              <Label className="text-slate-700">
                体重 (kg) {recordType === 'both' && <span className="text-xs text-slate-500">必須</span>}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="0.1"
                  min="0"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="text-2xl font-semibold text-center py-4 rounded-xl border border-slate-200 focus:border-blue-400"
                  placeholder="0.0"
                  style={{color: '#4682B4'}}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">kg</span>
              </div>
              
              {/* クイック調整ボタン */}
              <div className="flex justify-center space-x-2">
                {quickWeightAdjustments.map((adjustment) => (
                  <Button
                    key={adjustment}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeight(adjustment)}
                    className="px-3 py-1 text-xs rounded-lg border-slate-200 hover:bg-slate-50"
                  >
                    {adjustment > 0 ? '+' : ''}{adjustment}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 体脂肪率入力 */}
          {(recordType === 'bodyFat' || recordType === 'both') && (
            <div className="space-y-3">
              <Label className="text-slate-700">
                体脂肪率 (%) {recordType === 'both' ? <span className="text-xs text-slate-500">任意</span> : <span className="text-xs text-slate-500">必須</span>}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="0.1"
                  min="0"
                  max="50"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className="text-2xl font-semibold text-center py-4 rounded-xl border border-slate-200 focus:border-amber-400"
                  placeholder="15.0"
                  style={{color: '#F59E0B'}}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
            </div>
          )}


          {/* 送信ボタン */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1 py-3 rounded-xl text-white"
              style={{backgroundColor: '#4682B4'}}
            >
              記録する
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}