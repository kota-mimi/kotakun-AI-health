import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { X, Scale, Droplets, StickyNote, Camera } from 'lucide-react';

interface WeightEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { weight: number; bodyFat?: number; note?: string; photo?: string }) => void;
  currentWeight: number;
}

export function WeightEntryModal({ isOpen, onClose, onSubmit, currentWeight }: WeightEntryModalProps) {
  const [weight, setWeight] = useState(currentWeight.toString());
  const [bodyFat, setBodyFat] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0 || weightValue > 300) {
      alert('正しい体重を入力してください（0-300kg）');
      return;
    }

    const bodyFatValue = bodyFat ? parseFloat(bodyFat) : undefined;
    if (bodyFat && (isNaN(bodyFatValue!) || bodyFatValue! < 0 || bodyFatValue! > 50)) {
      alert('正しい体脂肪率を入力してください（0-50%）');
      return;
    }

    onSubmit({
      weight: weightValue,
      bodyFat: bodyFatValue,
      note: note.trim() || undefined,
      photo: photo || undefined
    });

    // フォームリセット
    setWeight(currentWeight.toString());
    setBodyFat('');
    setNote('');
    setPhoto('');
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
      hour12: false 
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-t-2xl w-full max-w-sm mx-auto p-6 space-y-6 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">体重を記録</h2>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 体重入力 */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2 text-slate-700">
              <Scale size={16} style={{color: '#4682B4'}} />
              <span>体重 (kg)</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
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

          {/* 体脂肪率入力（オプション） */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2 text-slate-700">
              <Droplets size={16} style={{color: '#F59E0B'}} />
              <span>体脂肪率 (%) <span className="text-xs text-slate-500">任意</span></span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="text-center py-3 rounded-xl border border-slate-200 focus:border-amber-400"
                placeholder="15.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
            </div>
          </div>

          {/* メモ（オプション） */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2 text-slate-700">
              <StickyNote size={16} style={{color: '#10B981'}} />
              <span>メモ <span className="text-xs text-slate-500">任意</span></span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="運動後、朝食前、など..."
              className="resize-none h-20 rounded-xl border border-slate-200 focus:border-green-400"
              maxLength={100}
            />
            <div className="text-right">
              <span className="text-xs text-slate-500">{note.length}/100</span>
            </div>
          </div>

          {/* 写真追加（プレースホルダー） */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2 text-slate-700">
              <Camera size={16} style={{color: '#6B7280'}} />
              <span>写真 <span className="text-xs text-slate-500">任意</span></span>
            </Label>
            <Button
              type="button"
              variant="outline"
              className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
              onClick={() => console.log('写真選択')}
            >
              <div className="text-center">
                <Camera size={24} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">写真を追加</p>
                <p className="text-xs text-slate-500">進捗の記録に</p>
              </div>
            </Button>
          </div>

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