import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface WeightChartProps {
  data: Array<{
    date: string;
    weight: number;
    bodyFat?: number;
    waist?: number;
    morningWeight?: number;
    eveningWeight?: number;
    note?: string;
  }>;
  period: 'week' | 'month' | '6months' | 'year';
  height: number;
  targetWeight?: number;
  currentWeight?: number;
}

type DataType = 'weight' | 'bodyFat' | 'waist';

export function WeightChart({ data = [], period, height, targetWeight = 68.0, currentWeight = 0 }: WeightChartProps) {
  const [selectedDataType, setSelectedDataType] = useState<DataType>('weight');
  const [selectedPoint, setSelectedPoint] = useState<{x: number, y: number, value: number, date: string} | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '6months' | 'year' | 'all'>('month');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);

  // データの検証とデフォルト値 - 体重または体脂肪のいずれかがあれば有効とする
  const validData = Array.isArray(data) ? data.filter(item => 
    item && item.date && (
      (typeof item.weight === 'number' && !isNaN(item.weight) && item.weight > 0) ||
      (typeof item.bodyFat === 'number' && !isNaN(item.bodyFat) && item.bodyFat > 0)
    )
  ) : [];

  // クライアントサイドでのみ実行されることを保証
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);
  
  // 実際のデータがある場合はそれを使用、ない場合はダミーデータ
  const hasRealData = validData.length > 0;
  
  // 期間別のダミーデータ
  const getAllChartData = () => {
    const weekData = [
      { date: '12/24', weight: 73.1, bodyFat: 17.3 },
      { date: '12/25', weight: 72.8, bodyFat: 17.2 },
      { date: '12/26', weight: 72.9, bodyFat: 17.1 },
      { date: '12/27', weight: 72.7, bodyFat: 17.0 },
      { date: '12/28', weight: 72.5, bodyFat: 16.9 },
      { date: '12/29', weight: 72.3, bodyFat: 16.8 },
      { date: '12/30', weight: 72.2, bodyFat: 16.7 }
    ];

    const monthData = [
      { date: '12/1', weight: 75.2, bodyFat: 18.5 },
      { date: '12/5', weight: 74.8, bodyFat: 18.2 },
      { date: '12/10', weight: 74.3, bodyFat: 18.0 },
      { date: '12/15', weight: 73.8, bodyFat: 17.8 },
      { date: '12/20', weight: 73.2, bodyFat: 17.5 },
      { date: '12/25', weight: 72.8, bodyFat: 17.2 },
      { date: '12/30', weight: 72.5, bodyFat: 17.0 }
    ];

    const sixMonthsData = [
      { date: '24/6/24', weight: 78.5, bodyFat: 20.2 },
      { date: '25/6/24', weight: 77.8, bodyFat: 19.5 },
      { date: '26/6/24', weight: 76.9, bodyFat: 19.0 },
      { date: '27/6/24', weight: 75.8, bodyFat: 18.5 },
      { date: '28/6/24', weight: 74.5, bodyFat: 18.0 },
      { date: '29/6/24', weight: 72.5, bodyFat: 17.0 }
    ];

    const yearData = [
      { date: '24/1/24', weight: 82.1, bodyFat: 22.5 },
      { date: '24/4/24', weight: 79.8, bodyFat: 21.2 },
      { date: '24/6/24', weight: 76.5, bodyFat: 19.8 },
      { date: '24/7/24', weight: 74.2, bodyFat: 18.5 },
      { date: '24/8/24', weight: 72.5, bodyFat: 17.0 }
    ];

    const allData = [
      { date: '24/6/23', weight: 85.2, bodyFat: 24.5 },
      { date: '24/9/23', weight: 83.8, bodyFat: 23.8 },
      { date: '24/12/23', weight: 82.1, bodyFat: 22.5 },
      { date: '24/3/24', weight: 80.2, bodyFat: 21.8 },
      { date: '24/6/24', weight: 77.8, bodyFat: 20.5 },
      { date: '24/9/24', weight: 75.1, bodyFat: 19.2 },
      { date: '24/12/24', weight: 72.5, bodyFat: 17.0 }
    ];

    switch (selectedPeriod) {
      case 'week': return weekData;
      case 'month': return monthData;
      case '6months': return sixMonthsData;
      case 'year': return yearData;
      case 'all': return allData;
      default: return monthData;
    }
  };

  // 実際のデータを使用するか、ダミーデータを使用するかを決定
  const getRealChartData = () => {
    if (!hasRealData) return getAllChartData();
    
    
    // クライアントサイドでのみ日付フィルタリングを実行（hydration issues を避けるため）
    if (!isClient) {
      const processedData = validData.map(item => {
        const itemDate = new Date(item.date);
        const formatDate = () => {
          const year = itemDate.getFullYear().toString().slice(-2);
          const month = itemDate.getMonth() + 1;
          const day = itemDate.getDate();
          return `${year}/${month}/${day}`;
        };
        
        return {
          date: formatDate(),
          weight: item.weight || 0,
          bodyFat: item.bodyFat || 0,
          waist: 80 // 仮の値（実際のデータにwaistがないため）
        };
      });
      return processedData;
    }
    
    // 実際のデータを期間でフィルタリング
    const filteredData = validData.filter(item => {
      // 'all' の場合は全データを返す
      if (selectedPeriod === 'all') return true;
      
      const itemDate = new Date(item.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 時間をリセットして日付のみで比較
      
      const diffDays = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (selectedPeriod) {
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        case '6months': return diffDays <= 180;
        case 'year': return diffDays <= 365;
        default: return diffDays <= 30;
      }
    });

    // データがない場合はダミーデータを使用
    if (filteredData.length === 0) {
      return getAllChartData();
    }

    // データフォーマットを統一（実際のデータはweight/bodyFatのみ、waistは仮の値）
    const processedData = filteredData.map(item => {
      const itemDate = new Date(item.date);
      const formatDate = () => {
        const year = itemDate.getFullYear().toString().slice(-2);
        const month = itemDate.getMonth() + 1;
        const day = itemDate.getDate();
        return `${year}/${month}/${day}`;
      };
      
      return {
        date: formatDate(),
        weight: item.weight || 0,
        bodyFat: item.bodyFat || 0,
        waist: 80 // 仮の値（実際のデータにwaistがないため）
      };
    });
    
    return processedData;
  };

  const chartData = getRealChartData();

  // データから動的に範囲を計算
  const calculateDataRange = (dataType: DataType) => {
    const values = chartData.map(item => item[dataType]).filter(val => val != null && val > 0);
    
    if (values.length === 0) {
      // デフォルト値
      switch (dataType) {
        case 'weight': return { min: 70, max: 77 };
        case 'bodyFat': return { min: 10, max: 25 };
        case 'waist': return { min: 77, max: 87 };
      }
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1; // 10%のパディング
    
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    };
  };

  const dataTypeConfig = {
    weight: { label: '体重', unit: 'kg', color: '#3B82F6', ...calculateDataRange('weight') },
    bodyFat: { label: '体脂肪', unit: '%', color: '#F97316', ...calculateDataRange('bodyFat') },
  };

  const currentConfig = dataTypeConfig[selectedDataType];
  const currentData = chartData.map(item => ({
    date: item.date,
    value: item[selectedDataType]
  })).filter(item => item.value != null && item.value > 0);
  

  const chartRange = currentConfig.max - currentConfig.min;

  // SVGパスを生成
  const svgWidth = 320;
  const svgHeight = 180;
  const pathPoints = currentData.length > 0 ? currentData.map((point, index) => {
    const x = currentData.length === 1 ? svgWidth / 2 : 5 + (index / (currentData.length - 1)) * (svgWidth - 10);
    const y = 10 + (svgHeight - 25) - ((point.value - currentConfig.min) / chartRange) * (svgHeight - 25);
    
    // NaN値をチェック
    const safeX = isNaN(x) ? 0 : x;
    const safeY = isNaN(y) ? svgHeight / 2 : y;
    
    return { x: safeX, y: safeY, value: point.value, date: point.date };
  }) : [];
  
  // 滑らかなベジェ曲線を生成
  const createSmoothPath = (points: typeof pathPoints) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      if (i === 0) {
        const controlX = current.x + (next.x - current.x) * 0.3;
        path += ` C ${controlX},${current.y} ${next.x - (next.x - current.x) * 0.3},${next.y} ${next.x},${next.y}`;
      } else {
        const prev = points[i - 1];
        const controlX1 = current.x + (next.x - prev.x) * 0.15;
        const controlX2 = next.x - (points[Math.min(i + 2, points.length - 1)].x - current.x) * 0.15;
        path += ` C ${controlX1},${current.y} ${controlX2},${next.y} ${next.x},${next.y}`;
      }
    }
    
    return path;
  };

  const smoothPathData = createSmoothPath(pathPoints);

  // グラデーション用のエリアパス
  const createAreaPath = (points: typeof pathPoints) => {
    if (points.length < 2) return '';
    
    let path = createSmoothPath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    
    path += ` L ${lastPoint.x},${svgHeight - 10}`;
    path += ` L ${firstPoint.x},${svgHeight - 10}`;
    path += ' Z';
    
    return path;
  };

  const areaPathData = createAreaPath(pathPoints);

  // 目標ライン（各データタイプに応じて）
  const getTargetValue = () => {
    switch (selectedDataType) {
      case 'weight': return targetWeight;
      case 'bodyFat': return 15.0; // 体脂肪の目標値
      default: return null;
    }
  };

  const targetValue = getTargetValue();
  const targetY = targetValue 
    ? 10 + (svgHeight - 25) - ((targetValue - currentConfig.min) / chartRange) * (svgHeight - 25)
    : null;

  // Y軸の目盛りを生成
  const yAxisTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const value = currentConfig.min + (currentConfig.max - currentConfig.min) * (i / tickCount);
    const y = 10 + (svgHeight - 25) - (i / tickCount) * (svgHeight - 25);
    yAxisTicks.push({ value, y });
  }

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const svgRect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const relativeX = (mouseX / svgRect.width) * (svgWidth + 40);
    
    // グラフエリア内かチェック
    if (relativeX < 5 || relativeX > svgWidth - 5) return;
    
    // 線上での補間ポイントを計算
    if (pathPoints.length < 2) return;
    
    // マウス位置に基づいてセグメントを見つける
    let segmentIndex = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      if (relativeX >= pathPoints[i].x && relativeX <= pathPoints[i + 1].x) {
        segmentIndex = i;
        break;
      }
    }
    
    const startPoint = pathPoints[segmentIndex];
    const endPoint = pathPoints[Math.min(segmentIndex + 1, pathPoints.length - 1)];
    
    // 線形補間でY座標を計算
    const t = startPoint.x === endPoint.x ? 0 : (relativeX - startPoint.x) / (endPoint.x - startPoint.x);
    const interpolatedY = startPoint.y + (endPoint.y - startPoint.y) * t;
    const interpolatedValue = startPoint.value + (endPoint.value - startPoint.value) * t;
    
    // 補間された点を設定
    setSelectedPoint({
      x: relativeX,
      y: interpolatedY,
      value: interpolatedValue,
      date: t < 0.5 ? startPoint.date : endPoint.date
    });
  };

  const handleTouchMove = (event: React.TouchEvent<SVGElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const svgRect = event.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - svgRect.left;
    const relativeX = (touchX / svgRect.width) * (svgWidth + 40);
    
    // グラフエリア内かチェック
    if (relativeX < 5 || relativeX > svgWidth - 5) return;
    
    // 線上での補間ポイントを計算
    if (pathPoints.length < 2) return;
    
    // マウス位置に基づいてセグメントを見つける
    let segmentIndex = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      if (relativeX >= pathPoints[i].x && relativeX <= pathPoints[i + 1].x) {
        segmentIndex = i;
        break;
      }
    }
    
    const startPoint = pathPoints[segmentIndex];
    const endPoint = pathPoints[Math.min(segmentIndex + 1, pathPoints.length - 1)];
    
    // 線形補間でY座標を計算
    const t = startPoint.x === endPoint.x ? 0 : (relativeX - startPoint.x) / (endPoint.x - startPoint.x);
    const interpolatedY = startPoint.y + (endPoint.y - startPoint.y) * t;
    const interpolatedValue = startPoint.value + (endPoint.value - startPoint.value) * t;
    
    // 補間された点を設定
    setSelectedPoint({
      x: relativeX,
      y: interpolatedY,
      value: interpolatedValue,
      date: t < 0.5 ? startPoint.date : endPoint.date
    });
  };

  const handleMouseLeave = () => {
    setSelectedPoint(null);
  };

  // サーバーサイドレンダリング時の表示
  if (!mounted) {
    return (
      <Card className="backdrop-blur-xl bg-white/90 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded mb-4"></div>
          <div className="h-40 bg-slate-200 rounded"></div>
        </div>
      </Card>
    );
  }

  // データが何もない場合の表示
  if (currentData.length === 0 || pathPoints.length === 0) {
    const dataTypeText = selectedDataType === 'weight' ? '体重' : '体脂肪';
    return (
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="w-full justify-start p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
            <div className="flex items-center space-x-2">
              <select 
                value={selectedDataType}
                onChange={(e) => {
                  e.stopPropagation();
                  setSelectedDataType(e.target.value as DataType);
                  setSelectedPoint(null);
                }}
                className="font-semibold text-slate-900 bg-transparent border-none outline-none cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="weight">体重グラフ</option>
                <option value="bodyFat">体脂肪グラフ</option>
              </select>
            </div>
            {isExpanded ? (
              <ChevronUp size={16} className="text-slate-500" />
            ) : (
              <ChevronDown size={16} className="text-slate-500" />
            )}
          </div>
        </Button>
        
        {/* グラフ内容 - 開閉可能 */}
        {isExpanded && (
          <div className="p-4">
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  {selectedDataType === 'weight' ? (
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-slate-600 text-base font-medium mb-2">{dataTypeText}データがまだありません</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedDataType === 'weight' 
                  ? '体重を記録すると、推移がグラフで表示されます' 
                  : '体脂肪を記録すると、推移がグラフで表示されます'
                }
              </p>
              <div className="mt-4">
                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                  {dataTypeText}を記録する
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        className="w-full justify-start p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
          <div className="flex items-center space-x-2">
            <select 
              value={selectedDataType}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedDataType(e.target.value as DataType);
                setSelectedPoint(null);
              }}
              className="font-semibold text-slate-900 bg-transparent border-none outline-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="weight">体重グラフ</option>
              <option value="bodyFat">体脂肪グラフ</option>
            </select>
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </div>
      </Button>

      {/* グラフ内容 - 開閉可能 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 期間選択ボタン */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            {[
              { key: 'week', label: '1週間' },
              { key: 'month', label: '1ヶ月' },
              { key: '6months', label: '半年' },
              { key: 'year', label: '1年' },
              { key: 'all', label: '全期間' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedPeriod(key as any);
                  setSelectedPoint(null);
                }}
                className={`flex-1 px-1 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  selectedPeriod === key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* グラフエリア */}
          <div className="relative">
        <div className="relative">
        <svg 
          width="100%" 
          height="200" 
          viewBox={`0 0 ${svgWidth + 40} ${svgHeight + 35}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseLeave}
          className="cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        >
          {/* グラデーション定義 */}
          <defs>
            <linearGradient id={`gradient-${selectedDataType}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentConfig.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={currentConfig.color} stopOpacity="0.05" />
            </linearGradient>
            <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="2" result="offset" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge> 
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* グリッドライン */}
          {yAxisTicks.map((tick, index) => (
            <line
              key={index}
              x1={5}
              y1={tick.y}
              x2={svgWidth - 5}
              y2={tick.y}
              stroke="#F1F5F9"
              strokeWidth="1"
              opacity="0.6"
            />
          ))}


          {/* エリアグラデーション */}
          <path
            d={areaPathData}
            fill={`url(#gradient-${selectedDataType})`}
            className="transition-all duration-700 ease-out"
          />

          
          {/* メインライン */}
          <path
            d={smoothPathData}
            fill="none"
            stroke={currentConfig.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#dropshadow)"
            className="transition-all duration-700 ease-out"
            style={{
              strokeDasharray: '1000',
              strokeDashoffset: '1000',
              animation: 'drawLine 2s ease-out forwards'
            }}
          />
          
          {/* インタラクティブエリア（見えない） */}
          <rect
            x="0"
            y="0"
            width={svgWidth + 40}
            height={svgHeight + 35}
            fill="transparent"
            className="cursor-crosshair"
          />

          {/* 垂直ガイドライン（選択時のみ表示） */}
          {selectedPoint && (
            <line
              x1={selectedPoint.x}
              y1={10}
              x2={selectedPoint.x}
              y2={svgHeight - 10}
              stroke="#3B82F6"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.6"
            />
          )}

          {/* 選択されたポイントのみ表示 */}
          {selectedPoint && (
            <>
              <circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r="6"
                fill={currentConfig.color}
                stroke="white"
                strokeWidth="3"
                filter="url(#dropshadow)"
              />
              <circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r="10"
                fill={currentConfig.color}
                fillOpacity="0.2"
                stroke={currentConfig.color}
                strokeWidth="1"
                className="animate-pulse"
              />
            </>
          )}

          {/* 右側Y軸の数値 */}
          {yAxisTicks.map((tick, index) => (
            <text
              key={index}
              x={svgWidth + 35}
              y={tick.y + 4}
              textAnchor="end"
              className="text-xs fill-slate-600"
            >
              {tick.value.toFixed(1)}
            </text>
          ))}
          
          {/* X軸ラベル */}
          {pathPoints.filter(point => !isNaN(point.x) && !isNaN(point.y)).map((point, index) => {
            return (
              <text
                key={index}
                x={point.x}
                y={svgHeight + 18}
                textAnchor="middle"
                className="text-xs fill-slate-500"
              >
                {point.date}
              </text>
            );
          })}
        </svg>

        {/* ポップアップ */}
        {selectedPoint && (
          <div 
            className="absolute bg-slate-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl text-sm pointer-events-none z-20 border border-white/10"
            style={{
              left: selectedPoint.x - 30,
              top: selectedPoint.y - 65,
              transform: 'translateX(-50%)',
              animation: 'fadeInScale 0.2s ease-out'
            }}
          >
            <div className="font-bold text-base" style={{ color: currentConfig.color }}>
              {selectedPoint.value.toFixed(1)}{currentConfig.unit}
            </div>
            <div className="text-xs mt-1" style={{ color: '#000000' }}>{selectedPoint.date}</div>
            {/* 矢印 */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(15, 23, 42, 0.95)'
              }}
            />
          </div>
        )}
          </div>
        </div>

        {/* CSSアニメーション */}
        <style jsx>{`
          @keyframes drawLine {
            to {
              stroke-dashoffset: 0;
            }
          }
          
          @keyframes fadeInPoint {
            from {
              opacity: 0;
              transform: scale(0);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: translateX(-50%) scale(0.8);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) scale(1);
            }
          }
        `}</style>
        </div>
      )}
    </Card>
  );
}