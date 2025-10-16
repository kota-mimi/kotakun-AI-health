import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Camera, Upload, Save, X, Trash2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';

interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
  image?: string;
  images?: string[];
  originalMealId?: string;
  individualMealIndex?: number;
}

interface EditMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal: MealItem | null;
  onUpdateMeal: (updatedMeal: MealItem) => void;
  onDeleteMeal: (mealId: string) => void;
}

const mealTypeLabels = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食'
};

export function EditMealModal({ isOpen, onClose, mealType, meal, onUpdateMeal, onDeleteMeal }: EditMealModalProps) {
  const { liffUser } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  // 編集対象の食事データを初期値として設定
  useEffect(() => {
    if (meal && isOpen) {
      setMealName(meal.name);
      setCalories(meal.calories.toString());
      setProtein(meal.protein?.toString() || '');
      setFat(meal.fat?.toString() || '');
      setCarbs(meal.carbs?.toString() || '');
      setTime(meal.time);
      setUploadedImage(meal.image || null);
      setUploadedFile(null); // ファイルもリセット
      setNotes('');
    }
  }, [meal, isOpen]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルを保存（後でFirebaseにアップロード用）
      setUploadedFile(file);
      
      // 画像をプレビュー用にセット
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToFirebase = async (file: File): Promise<string | null> => {
    try {
      if (!liffUser?.userId) {
        console.error('❌ ユーザーIDが取得できません');
        return null;
      }

      console.log('🔧 Starting API-based image upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: liffUser.userId
      });

      // サーバーサイドのAPIエンドポイント経由でアップロード
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', liffUser.userId);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload API failed: ${errorData.error} - ${errorData.details}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.imageUrl) {
        throw new Error('API returned invalid response');
      }

      console.log('✅ API-based image upload successful:', data.imageUrl);
      return data.imageUrl;
    } catch (error: any) {
      console.error('❌ API-based image upload failed:', {
        error: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      return null;
    }
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🚨 PRODUCTION DEBUG: Update button clicked');
    
    if (!meal || !mealName || !calories) return;

    let finalImageUrl = uploadedImage;
    
    // 新しい画像ファイルがある場合はFirebaseにアップロード
    if (uploadedFile) {
      console.log('🔧 Uploading new image to Firebase Storage...');
      setIsAnalyzing(true);
      
      // 既存の画像がある場合は削除を試行（エラーは無視）
      if (meal.image && meal.image.includes('firebasestorage.googleapis.com')) {
        try {
          // Firebase Storage URLからパスを抽出
          const urlParts = meal.image.split('/o/')[1];
          if (urlParts) {
            const imagePath = decodeURIComponent(urlParts.split('?')[0]);
            const oldImageRef = ref(storage, imagePath);
            await deleteObject(oldImageRef);
            console.log('🗑️ Old image deleted successfully from path:', imagePath);
          }
        } catch (error) {
          console.log('🗑️ Old image deletion failed (may not exist):', error);
          // エラーを無視して続行
        }
      }
      
      finalImageUrl = await uploadImageToFirebase(uploadedFile);
      setIsAnalyzing(false);
      
      if (!finalImageUrl) {
        console.error('画像のアップロードに失敗しました');
        return;
      }
    }
    
    // 画像が削除された場合（元々あったが今はnull）の処理
    if (meal.image && !finalImageUrl && !uploadedFile) {
      console.log('🗑️ Image being deleted, removing from Firebase Storage...');
      if (meal.image.includes('firebasestorage.googleapis.com')) {
        try {
          // Firebase Storage URLからパスを抽出
          const urlParts = meal.image.split('/o/')[1];
          if (urlParts) {
            const imagePath = decodeURIComponent(urlParts.split('?')[0]);
            const oldImageRef = ref(storage, imagePath);
            await deleteObject(oldImageRef);
            console.log('🗑️ Image deleted from Firebase Storage successfully from path:', imagePath);
          }
        } catch (error) {
          console.log('🗑️ Image deletion failed (may not exist):', error);
          // エラーを無視して続行
        }
      }
    }
    
    // デバッグ用ログ
    console.log('🔧 Image update debug:', {
      originalImage: meal.image,
      uploadedImage: uploadedImage,
      uploadedFile: !!uploadedFile,
      finalImageUrl: finalImageUrl,
      isImageDeleted: meal.image && !finalImageUrl && !uploadedFile
    });

    const updatedMeal: MealItem = {
      ...meal,
      name: mealName,
      calories: parseInt(calories),
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
      carbs: parseFloat(carbs) || 0,
      time: time,
      image: finalImageUrl || undefined,
      images: finalImageUrl ? [finalImageUrl] : [],
      originalMealId: meal.originalMealId,
      individualMealIndex: meal.individualMealIndex
    };

    console.log('🚨 PRODUCTION DEBUG: Calling onUpdateMeal with:', updatedMeal);
    onUpdateMeal(updatedMeal);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🚨 PRODUCTION DEBUG: Delete button clicked');
    
    if (meal && window.confirm('この食事記録を削除しますか？')) {
      // 複数食事の個別削除の場合、元のIDを使用
      const deleteId = meal.originalMealId && meal.individualMealIndex !== undefined 
        ? `${meal.originalMealId}_${meal.individualMealIndex}`
        : meal.id;
      console.log('🚨 PRODUCTION DEBUG: Calling onDeleteMeal with:', { originalId: meal.id, deleteId, originalMealId: meal.originalMealId, individualMealIndex: meal.individualMealIndex });
      onDeleteMeal(deleteId);
      onClose();
    }
  };

  const handleClearImage = () => {
    console.log('🗑️ Clearing image - original image will be deleted on save');
    setUploadedImage(null);
    setUploadedFile(null);
    // 全てのfile inputをクリア
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (albumInputRef.current) albumInputRef.current.value = '';
  };

  if (!meal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm mx-auto max-h-[50vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>{mealTypeLabels[mealType]}を編集</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
            >
              <Trash2 size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 画像アップロード */}
          <div className="space-y-3">
            <Label>写真を変更</Label>
            
            {uploadedImage ? (
              <Card className="relative">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 block"
                >
                  <ImageWithFallback
                    src={uploadedImage}
                    alt="編集中の食事"
                    className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                  />
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <X size={14} />
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-20 flex flex-col items-center justify-center space-y-1"
                  style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                >
                  <Camera size={20} style={{color: '#4682B4'}} />
                  <span className="text-xs" style={{color: '#4682B4'}}>カメラ</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => albumInputRef.current?.click()}
                  className="h-20 flex flex-col items-center justify-center space-y-1"
                  style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                >
                  <Upload size={20} style={{color: '#4682B4'}} />
                  <span className="text-xs" style={{color: '#4682B4'}}>アルバム</span>
                </Button>
              </div>
            )}
            
            {/* カメラ専用（直接カメラ起動） */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {/* アルバム専用（写真ライブラリから選択） */}
            <input
              ref={albumInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {/* 既存画像変更用（汎用） */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* 手動入力フォーム */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="mealName">食事名</Label>
              <Input
                id="mealName"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="例: サーモンアボカド丼"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="time">時刻</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="19:30"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="calories">カロリー (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="520"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="protein">タンパク質 (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="28.5"
                />
              </div>
              <div>
                <Label htmlFor="fat">脂質 (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="18.5"
                />
              </div>
              <div>
                <Label htmlFor="carbs">炭水化物 (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="45.5"
                />
              </div>
            </div>


          </div>

          {/* ボタン */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              キャンセル
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!mealName || !calories || isAnalyzing}
              className="flex-1"
              style={{backgroundColor: '#4682B4'}}
            >
              <Save size={16} className="mr-1" />
              {isAnalyzing ? 'アップロード中...' : '更新'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}