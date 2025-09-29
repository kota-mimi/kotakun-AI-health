import { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Camera, Type, Clock, X, Sparkles } from 'lucide-react';

interface FloatingActionButtonProps {
  onCameraRecord: () => void;
  onTextRecord: () => void;
  onPastRecord: () => void;
  onManualRecord: () => void;
}

export function FloatingActionButton({ 
  onCameraRecord, 
  onTextRecord, 
  onPastRecord, 
  onManualRecord 
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Camera,
      label: 'カメラで記録',
      onClick: () => {
        onCameraRecord();
        setIsOpen(false);
      },
      gradient: 'from-blue-500 to-indigo-600',
      delay: 'delay-75'
    },
    {
      icon: Type,
      label: 'テキストで記録',
      onClick: () => {
        onTextRecord();
        setIsOpen(false);
      },
      gradient: 'from-green-500 to-emerald-600',
      delay: 'delay-100'
    },
    {
      icon: Clock,
      label: '過去の記録',
      onClick: () => {
        onPastRecord();
        setIsOpen(false);
      },
      gradient: 'from-purple-500 to-pink-600',
      delay: 'delay-150'
    },
    {
      icon: Sparkles,
      label: '手動入力',
      onClick: () => {
        onManualRecord();
        setIsOpen(false);
      },
      gradient: 'from-orange-500 to-red-600',
      delay: 'delay-200'
    }
  ];

  return (
    <div className="fixed bottom-24 right-6 z-40">
      {/* 背景オーバーレイ */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* アクションボタンリスト */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <div
                key={action.label}
                className={`transform transition-all duration-500 ease-out ${
                  isOpen 
                    ? `translate-y-0 opacity-100 scale-100 ${action.delay}` 
                    : 'translate-y-8 opacity-0 scale-50'
                }`}
              >
                <Button
                  onClick={action.onClick}
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl border-0 group relative`}
                >
                  <IconComponent size={24} className="text-white" />
                  
                  {/* ツールチップ */}
                  <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm text-slate-800 text-sm font-medium px-3 py-2 rounded-xl shadow-lg border border-slate-200/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {action.label}
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-l-white/95 border-t-transparent border-b-transparent" />
                  </div>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* メインボタン */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 shadow-2xl hover:shadow-3xl border-0 transition-all duration-500 ${
          isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'
        } relative overflow-hidden group`}
      >
        {/* 背景アニメーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* アイコン */}
        <div className="relative z-10">
          {isOpen ? (
            <X size={28} className="text-white transition-transform duration-300" />
          ) : (
            <Plus size={28} className="text-white transition-transform duration-300" />
          )}
        </div>

        {/* リップル効果 */}
        <div className="absolute inset-0 rounded-2xl bg-white/30 scale-0 group-active:scale-100 transition-transform duration-200" />
      </Button>

      {/* 影の効果 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 blur-xl opacity-30 -z-10 scale-75 group-hover:scale-100 transition-transform duration-500" />
    </div>
  );
}