import { useState, useEffect, useRef } from 'react';

interface NumberPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  unit?: string;
  className?: string;
}

export function NumberPicker({ 
  min, 
  max, 
  value, 
  onChange, 
  step = 1, 
  unit = '', 
  className = '' 
}: NumberPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // 数値の配列を生成
  const numbers = [];
  for (let i = min; i <= max; i += step) {
    numbers.push(i);
  }
  
  const currentIndex = numbers.findIndex(num => num === value);
  const itemHeight = 30; // 各アイテムの高さ
  
  useEffect(() => {
    if (containerRef.current && !isScrolling) {
      const scrollTop = currentIndex * itemHeight;
      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [value, currentIndex, isScrolling]);
  
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const centerIndex = Math.round(scrollTop / itemHeight);
    const selectedValue = numbers[centerIndex];
    
    if (selectedValue !== undefined && selectedValue !== value) {
      onChange(selectedValue);
    }
  };
  
  const handleScrollStart = () => {
    setIsScrolling(true);
  };
  
  const handleScrollEnd = () => {
    setTimeout(() => {
      setIsScrolling(false);
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const centerIndex = Math.round(scrollTop / itemHeight);
        const targetScrollTop = centerIndex * itemHeight;
        
        containerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, 150);
  };
  
  return (
    <div className={`relative bg-white border border-slate-200 rounded-xl ${className}`}>
      {/* セレクトライン */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[30px] border-y-2 border-blue-500 bg-blue-50/30 pointer-events-none z-10"></div>
      
      {/* 上下グラデーション */}
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none z-20"></div>
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none z-20"></div>
      
      {/* 数字スクロールエリア */}
      <div
        ref={containerRef}
        className="h-32 overflow-y-scroll scrollbar-hide"
        style={{ 
          scrollSnapType: 'y mandatory',
          paddingTop: '45px',
          paddingBottom: '45px'
        }}
        onScroll={handleScroll}
        onScrollCapture={handleScrollStart}
        onScrollEnd={handleScrollEnd}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
      >
        {numbers.map((number, index) => {
          const isSelected = number === value;
          const distance = Math.abs(index - currentIndex);
          const opacity = Math.max(0.3, 1 - distance * 0.3);
          const scale = Math.max(0.8, 1 - distance * 0.1);
          
          return (
            <div
              key={number}
              className={`h-[30px] flex items-center justify-center transition-all duration-200 ${
                isSelected ? 'text-blue-600 font-bold' : 'text-slate-600'
              }`}
              style={{
                scrollSnapAlign: 'center',
                opacity,
                transform: `scale(${scale})`
              }}
              onClick={() => onChange(number)}
            >
              <span className="text-lg">
                {number.toString().padStart(2, '0')}
                {unit && <span className="text-xs ml-1 text-slate-500">{unit}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}