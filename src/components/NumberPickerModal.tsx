import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface NumberPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  min: number;
  max: number;
  value: number;
  step?: number;
  unit?: string;
  title: string;
}

export function NumberPickerModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  min, 
  max, 
  value, 
  step = 1, 
  unit = '', 
  title 
}: NumberPickerModalProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const velocityRef = useRef(0);
  const lastTouchRef = useRef({ y: 0, time: 0 });
  const isDraggingRef = useRef(false);
  
  // 数値配列生成
  const numbers = [];
  for (let i = min; i <= max; i += step) {
    numbers.push(i);
  }
  
  const itemHeight = 50;
  
  useEffect(() => {
    if (isOpen) {
      setCurrentValue(value);
    }
  }, [isOpen, value]);
  
  // 初期位置にスクロール
  useEffect(() => {
    if (containerRef.current && isOpen) {
      const currentIndex = numbers.findIndex(num => num === currentValue);
      if (currentIndex >= 0) {
        const scrollTop = currentIndex * itemHeight;
        containerRef.current.scrollTop = scrollTop;
      }
    }
  }, [isOpen, currentValue, numbers]);
  
  // スムーズな慣性スクロールとスナップ
  const snapToNearest = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const centerIndex = Math.round(scrollTop / itemHeight);
    const targetScrollTop = centerIndex * itemHeight;
    
    // 滑らかなアニメーション
    const startScroll = scrollTop;
    const distance = targetScrollTop - startScroll;
    const startTime = performance.now();
    const duration = 300;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutCubic イージング
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScroll = startScroll + (distance * easeProgress);
      
      if (containerRef.current) {
        containerRef.current.scrollTop = currentScroll;
        
        // 値を更新
        const newIndex = Math.round(currentScroll / itemHeight);
        const newValue = numbers[newIndex];
        if (newValue !== undefined && newValue !== currentValue) {
          setCurrentValue(newValue);
        }
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [numbers, currentValue, itemHeight]);
  
  // 慣性スクロール
  const applyMomentum = useCallback(() => {
    if (!containerRef.current || Math.abs(velocityRef.current) < 0.1) {
      snapToNearest();
      return;
    }
    
    const deceleration = 0.95;
    const startTime = performance.now();
    
    const momentum = () => {
      if (!containerRef.current) return;
      
      velocityRef.current *= deceleration;
      const newScrollTop = containerRef.current.scrollTop + velocityRef.current;
      
      // 境界チェック
      const maxScroll = (numbers.length - 1) * itemHeight;
      const clampedScroll = Math.max(0, Math.min(maxScroll, newScrollTop));
      
      containerRef.current.scrollTop = clampedScroll;
      
      // 値を更新
      const centerIndex = Math.round(clampedScroll / itemHeight);
      const selectedValue = numbers[centerIndex];
      if (selectedValue !== undefined && selectedValue !== currentValue) {
        setCurrentValue(selectedValue);
      }
      
      if (Math.abs(velocityRef.current) > 0.1) {
        animationRef.current = requestAnimationFrame(momentum);
      } else {
        snapToNearest();
      }
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(momentum);
  }, [snapToNearest, numbers, currentValue]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    isDraggingRef.current = true;
    lastTouchRef.current = {
      y: e.touches[0].clientY,
      time: performance.now()
    };
    velocityRef.current = 0;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const currentTime = performance.now();
    
    const deltaY = lastTouchRef.current.y - currentY;
    const deltaTime = currentTime - lastTouchRef.current.time;
    
    if (deltaTime > 0) {
      velocityRef.current = deltaY / deltaTime * 16; // 60fps調整
    }
    
    const newScrollTop = containerRef.current.scrollTop + deltaY;
    const maxScroll = (numbers.length - 1) * itemHeight;
    const clampedScroll = Math.max(0, Math.min(maxScroll, newScrollTop));
    
    containerRef.current.scrollTop = clampedScroll;
    
    // 値を更新
    const centerIndex = Math.round(clampedScroll / itemHeight);
    const selectedValue = numbers[centerIndex];
    if (selectedValue !== undefined && selectedValue !== currentValue) {
      setCurrentValue(selectedValue);
    }
    
    lastTouchRef.current = { y: currentY, time: currentTime };
  };
  
  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    applyMomentum();
  };
  
  const handleConfirm = () => {
    onConfirm(currentValue);
    onClose();
  };
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100"
          >
            <X size={20} className="text-slate-600" />
          </Button>
        </div>
        
        {/* スクロールピッカー */}
        <div className="relative mx-6 mb-6">
          {/* 選択インジケーター */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-blue-50 border-y-2 border-blue-500 rounded-lg pointer-events-none z-10"></div>
          
          {/* 上下グラデーション */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-20"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-20"></div>
          
          {/* 数値リスト */}
          <div
            ref={containerRef}
            className="h-48 overflow-hidden relative"
            style={{ 
              paddingTop: `${itemHeight * 2}px`,
              paddingBottom: `${itemHeight * 2}px`,
              touchAction: 'pan-y',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              cursor: 'grab'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {numbers.map((number, index) => {
              const isSelected = number === currentValue;
              
              return (
                <div
                  key={number}
                  className="flex items-center justify-center transition-all duration-100"
                  style={{ 
                    height: `${itemHeight}px`,
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    opacity: isSelected ? 1 : 0.6
                  }}
                  onClick={() => {
                    setCurrentValue(number);
                    if (containerRef.current) {
                      if (animationRef.current) {
                        cancelAnimationFrame(animationRef.current);
                      }
                      
                      const targetScrollTop = index * itemHeight;
                      const startScroll = containerRef.current.scrollTop;
                      const distance = targetScrollTop - startScroll;
                      const startTime = performance.now();
                      const duration = 400;
                      
                      const animate = (currentTime: number) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeProgress = 1 - Math.pow(1 - progress, 3);
                        
                        if (containerRef.current) {
                          containerRef.current.scrollTop = startScroll + (distance * easeProgress);
                        }
                        
                        if (progress < 1) {
                          animationRef.current = requestAnimationFrame(animate);
                        }
                      };
                      
                      animationRef.current = requestAnimationFrame(animate);
                    }
                  }}
                >
                  <span 
                    className={`text-2xl transition-all duration-200 ${
                      isSelected 
                        ? 'font-bold text-blue-600' 
                        : 'font-normal text-slate-600'
                    }`}
                  >
                    {step < 1 ? number.toFixed(1) : number}
                    {unit && <span className="text-lg ml-2 opacity-70">{unit}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* ボタン */}
        <div className="flex space-x-3 p-6 pt-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-slate-200 hover:bg-slate-50"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl text-white"
            style={{backgroundColor: '#3B82F6'}}
          >
            決定
          </Button>
        </div>
      </div>
    </div>
  );
}