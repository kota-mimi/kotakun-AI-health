import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { MessageCircle, Camera, Plus, X } from 'lucide-react';

interface FloatingShortcutBarProps {
  onTextRecord: () => void;
  onCameraRecord: () => void;
  onAddExercise?: () => void;
}

export function FloatingShortcutBar({ onTextRecord, onCameraRecord, onAddExercise }: FloatingShortcutBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    // モバイルデバイスでカメラを開く
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCameraRecord();
    }
  };

  if (isExpanded) {
    return (
      <div className="fixed bottom-28 left-0 right-0 z-50 px-4">
        <div className="mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-900">クイック記録</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 p-0 text-slate-500 hover:text-slate-700"
              >
                <X size={14} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* テキストで記録 */}
              <Button
                onClick={() => {
                  onTextRecord();
                  setIsExpanded(false);
                }}
                className="flex flex-col items-center justify-center h-20 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl"
              >
                <MessageCircle size={24} className="mb-1" />
                <span className="text-xs font-medium">テキストで記録</span>
              </Button>

              {/* 写真で食事記録 */}
              <Button
                onClick={() => {
                  handleCameraClick();
                  setIsExpanded(false);
                }}
                className="flex flex-col items-center justify-center h-20 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl"
              >
                <Camera size={24} className="mb-1" />
                <span className="text-xs font-medium">写真で食事記録</span>
              </Button>
            </div>

            {/* 運動記録ボタン（オプション） */}
            {onAddExercise && (
              <div className="mt-3">
                <Button
                  onClick={() => {
                    onAddExercise();
                    setIsExpanded(false);
                  }}
                  className="w-full flex items-center justify-center h-12 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl"
                >
                  <span className="text-sm font-medium">運動を記録</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ファイル入力（非表示） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // 折りたたまれた状態
  return (
    <div className="fixed bottom-28 left-0 right-0 z-50 px-4">
      <div className="mx-auto max-w-lg">
        <div className="flex justify-center space-x-3">
          {/* テキストで記録ボタン */}
          <Button
            onClick={onTextRecord}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-full px-4 py-2 shadow-lg"
          >
            <MessageCircle size={18} />
            <span className="text-sm font-medium">テキストで記録</span>
          </Button>

          {/* 写真で食事記録ボタン */}
          <Button
            onClick={handleCameraClick}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-full px-4 py-2 shadow-lg"
          >
            <Camera size={18} />
            <span className="text-sm font-medium">写真で食事記録</span>
          </Button>

          {/* 展開ボタン */}
          <Button
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
          >
            <Plus size={20} />
          </Button>
        </div>

        {/* ファイル入力（非表示） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}