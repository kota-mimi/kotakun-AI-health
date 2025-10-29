import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface WeightChartProps {
  data: Array<{
    date: string;
    weight: number;
    waist?: number;
    morningWeight?: number;
    eveningWeight?: number;
    note?: string;
  }>;
  period: 'week' | 'month' | '6months' | 'year';
  height: number;
  targetWeight?: number;
  currentWeight?: number;
  counselingResult?: any;
}

type DataType = 'weight' | 'waist';

export function WeightChart({ data = [], period, height, targetWeight = 68.0, currentWeight = 0, counselingResult }: WeightChartProps) {
  const [selectedDataType, setSelectedDataType] = useState<DataType>('weight');
  const [selectedPoint, setSelectedPoint] = useState<{x: number, y: number, value: number, date: string} | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    return oneMonthAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  // データの検証とデフォルト値 - メモ化で最適化
  const validData = useMemo(() => 
    Array.isArray(data) ? data.filter(item => 
      item && item.date && (typeof item.weight === 'number' && !isNaN(item.weight) && item.weight > 0)
    ) : [], [data]);

  // マウント状態の管理 - 遅延なし
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 実際のデータがある場合はそれを使用、ない場合でもカウンセリング結果があれば初期データを作成
  const hasRealData = validData.length > 0;
  const hasCounselingData = counselingResult?.answers?.weight && counselingResult.answers.weight > 0;

  // カウンセリング初期データの生成をメモ化
  const counselingInitialData = useMemo(() => {
    if (!hasCounselingData) return [];
    
    const counselingDateRaw = counselingResult.completedAt || counselingResult.createdAt;
    let counselingDate;
    
    if (counselingDateRaw?.seconds) {
      counselingDate = new Date(counselingDateRaw.seconds * 1000);
    } else if (counselingDateRaw) {
      counselingDate = new Date(counselingDateRaw);
    } else {
      counselingDate = new Date();
    }
    
    if (isNaN(counselingDate.getTime())) {
      counselingDate = new Date();
    }
    
    const dateStr = `${counselingDate.getMonth() + 1}/${counselingDate.getDate()}`;
    
    return [{
      date: dateStr,
      weight: counselingResult.answers.weight,
    }];
  }, [hasCounselingData, counselingResult]);

  // チャートデータ処理をメモ化で最適化
  const chartData = useMemo(() => {
    if (!hasRealData && !hasCounselingData) return [];
    if (!hasRealData && hasCounselingData) return counselingInitialData;
    
    if (!mounted) {
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
          waist: 80 // 仮の値（実際のデータにwaistがないため）
        };
      });
      return processedData;
    }
    
    // 日付範囲でフィルタリング
    const startDateTime = new Date(startDate + 'T00:00:00');
    const endDateTime = new Date(endDate + 'T23:59:59');
    
    const filteredData = validData.filter(item => {
      const itemDate = new Date(item.date + 'T00:00:00');
      return itemDate >= startDateTime && itemDate <= endDateTime;
    }).sort((a, b) => {
      const dateA = new Date(a.date + 'T00:00:00');
      const dateB = new Date(b.date + 'T00:00:00');
      return dateA.getTime() - dateB.getTime();
    });

    // データがない場合は空配列を返す
    if (filteredData.length === 0) {
      return [];
    }

    // データ量に応じて自動間引き（シンプル化）
    let downsampledData = filteredData;
    if (filteredData.length > 50) {
      // 50件以上の場合は適切に間引く
      const interval = Math.ceil(filteredData.length / 50);
      downsampledData = filteredData.filter((_, index) => index % interval === 0);
    }

    // データフォーマットを統一（実際のデータはweightのみ、waistは仮の値）
    const processedData = downsampledData.map(item => {
      // ISO形式の日付（YYYY-MM-DD）を正しく解析
      let itemDate: Date;
      if (typeof item.date === 'string') {
        // ISO形式の日付文字列を直接解析
        itemDate = new Date(item.date + 'T00:00:00');
      } else {
        itemDate = new Date(item.date);
      }
      
      // 日付が無効な場合はスキップ
      if (isNaN(itemDate.getTime())) {
        console.warn('⚠️ Invalid date in WeightChart processedData:', item.date, 'parsed as:', itemDate);
        return null;
      }
      
      const formatDate = () => {
        const month = itemDate.getMonth() + 1;
        const day = itemDate.getDate();
        return `${month}/${day}`;
      };
      
      return {
        date: formatDate(),
        weight: item.weight || 0,
        waist: 80 // 仮の値（実際のデータにwaistがないため）
      };
    }).filter(item => item !== null); // null値を除外
    
    return processedData;
  }, [hasRealData, hasCounselingData, counselingInitialData, validData, startDate, endDate, mounted]);

  // データから適切な範囲を計算（動的スケーリング対応）- メモ化
  const dataRange = useMemo(() => {
    const dataType = selectedDataType;
    const values = chartData.map(item => item[dataType]).filter(val => {
      // 体重の場合は0より大きい値のみ、体脂肪の場合は0以上の値を許可
      if (dataType === 'weight') {
        return val != null && val > 0;
      } else {
        return val != null && val >= 0;
      }
    });
    
    if (values.length === 0) {
      // デフォルト値
      switch (dataType) {
        case 'weight': return { min: 70, max: 77 };
        case 'waist': return { min: 77, max: 87 };
      }
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const center = (min + max) / 2;
    const actualRange = max - min;
    
    // 体重の場合は固定5kg範囲
    if (dataType === 'weight') {
      const fixedRange = 5; // 固定5kg幅
      return {
        min: center - fixedRange / 2,
        max: center + fixedRange / 2
      };
    }
    
    // 体脂肪の場合
    if (false) { // 体脂肪削除のため無効化
      // 単一データポイントの場合の処理
      if (values.length === 1) {
        const singleValue = values[0];
        return {
          min: Math.max(0, singleValue - 4), // 単一ポイントなら±4%の範囲で表示
          max: singleValue + 4
        };
      }
      
      const fixedRange = 8; // 8%幅
      return {
        min: Math.max(0, center - fixedRange / 2),
        max: center + fixedRange / 2
      };
    }
    
    // その他（waist等）
    const fixedRange = 10;
    return {
      min: Math.max(0, center - fixedRange / 2),
      max: center + fixedRange / 2
    };
  }, [chartData, selectedDataType]);

  const dataTypeConfig = useMemo(() => ({
    weight: { label: '体重', unit: 'kg', color: '#3B82F6', ...dataRange },
  }), [dataRange]);

  const currentConfig = dataTypeConfig[selectedDataType];
  
  const currentData = useMemo(() => 
    chartData.map(item => ({
      date: item.date,
      value: item[selectedDataType]
    })).filter(item => {
      // 体重の場合は0より大きい値のみ、体脂肪の場合は0以上の値を許可
      if (selectedDataType === 'weight') {
        return item.value != null && item.value > 0;
      } else {
        return item.value != null && item.value >= 0;
      }
    }), [chartData, selectedDataType]);
  

  const chartRange = currentConfig.max - currentConfig.min;

  // SVGパスを生成
  const svgWidth = 320;
  const svgHeight = 180;
  
  // データ数に応じて適切な間隔を計算
  const calculateXPositions = () => {
    if (currentData.length === 0) return [];
    if (currentData.length === 1) return [20]; // 左端から開始
    
    // 1日あたりの固定幅を設定（40px程度）
    const dayWidth = 40;
    const totalDataWidth = (currentData.length - 1) * dayWidth;
    
    // グラフエリアの最大幅（マージンを考慮）
    const maxGraphWidth = svgWidth - 10;
    
    // データが少ない場合は固定幅、多い場合は圧縮
    const actualWidth = Math.min(totalDataWidth, maxGraphWidth);
    const startX = 20; // 左端から開始
    
    return currentData.map((_, index) => {
      if (currentData.length === 1) return 20; // 左端から開始
      return startX + (index / (currentData.length - 1)) * actualWidth;
    });
  };
  
  // SVGパス計算をメモ化
  const pathPoints = useMemo(() => {
    if (currentData.length === 0) return [];
    
    const xPositions = calculateXPositions();
    return currentData.map((point, index) => {
    const x = xPositions[index];
    const y = 10 + (svgHeight - 25) - ((point.value - currentConfig.min) / chartRange) * (svgHeight - 25);
    
    // NaN値をチェック
    const safeX = isNaN(x) ? 0 : x;
    const safeY = isNaN(y) ? svgHeight / 2 : y;
    
    return { x: safeX, y: safeY, value: point.value, date: point.date };
    });
  }, [currentData, currentConfig, svgHeight]);
  
  // より滑らかなCardinal曲線を生成
  const createSmoothPath = (points: typeof pathPoints) => {
    if (points.length < 1) return '';
    if (points.length === 1) {
      // 1つのポイントの場合は小さな線分として描画
      const point = points[0];
      return `M ${point.x - 2},${point.y} L ${point.x + 2},${point.y}`;
    }
    
    if (points.length === 2) {
      // 2つのポイントの場合は直線
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }
    
    // Cardinal曲線のテンション（0.3-0.5が自然）
    const tension = 0.4;
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const p0 = i === 1 ? points[0] : points[i - 2];
      const p1 = points[i - 1];
      const p2 = points[i];
      const p3 = i === points.length - 1 ? points[i] : points[i + 1];
      
      // Cardinal曲線の制御点を計算
      const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 6;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    
    return path;
  };

  const smoothPathData = useMemo(() => createSmoothPath(pathPoints), [pathPoints]);

  // グラデーション用のエリアパス
  const createAreaPath = (points: typeof pathPoints) => {
    if (points.length < 2) return '';
    
    let path = createSmoothPath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    
    // 同じ値の場合でも適切な高さを保つ（有効なデータポイントが2つ以上ある場合のみチェック）
    const allSameValue = points.length >= 2 && points.every(p => Math.abs(p.value - points[0].value) < 0.01);
    
    if (allSameValue) {
      // 同じ値の場合、適切な厚みを持った帯状のエリアを作成
      const minHeight = 12;
      const topY = Math.max(10, points[0].y - minHeight / 2);
      const bottomY = Math.min(svgHeight - 10, points[0].y + minHeight / 2);
      
      // 直線の帯状エリア
      return `M ${firstPoint.x},${topY} L ${lastPoint.x},${topY} L ${lastPoint.x},${bottomY} L ${firstPoint.x},${bottomY} Z`;
    }
    
    // 通常の場合
    path += ` L ${lastPoint.x},${svgHeight - 10}`;
    path += ` L ${firstPoint.x},${svgHeight - 10}`;
    path += ' Z';
    
    return path;
  };

  const areaPathData = useMemo(() => createAreaPath(pathPoints), [pathPoints]);

  // 目標ライン（各データタイプに応じて）
  const getTargetValue = () => {
    switch (selectedDataType) {
      case 'weight': return targetWeight;
      default: return null;
    }
  };

  const targetValue = getTargetValue();
  const targetY = targetValue 
    ? 10 + (svgHeight - 25) - ((targetValue - currentConfig.min) / chartRange) * (svgHeight - 25)
    : null;

  // Y軸の目盛りを生成（動的範囲対応）
  const generateYAxisTicks = () => {
    const range = currentConfig.max - currentConfig.min;
    
    // 固定1kg刻み
    const tickInterval = 1;
    
    // 開始値を間隔に合わせて調整
    const startValue = Math.floor(currentConfig.min / tickInterval) * tickInterval;
    const endValue = Math.ceil(currentConfig.max / tickInterval) * tickInterval;
    
    const ticks = [];
    for (let value = startValue; value <= endValue; value += tickInterval) {
      if (value >= currentConfig.min && value <= currentConfig.max) {
        const normalizedY = (value - currentConfig.min) / (currentConfig.max - currentConfig.min);
        const y = 10 + (svgHeight - 25) - normalizedY * (svgHeight - 25);
        ticks.push({ value, y });
      }
    }
    
    return ticks;
  };

  const yAxisTicks = useMemo(() => generateYAxisTicks(), [currentConfig]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGElement>) => {
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
  }, [pathPoints]);

  const handleTouchMove = useCallback((event: React.TouchEvent<SVGElement>) => {
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
  }, [pathPoints]);

  const handleMouseLeave = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  // 初期マウント時は即座に表示（ローディング削除）

  // データが何もない場合の表示
  if (currentData.length === 0 || pathPoints.length === 0) {
    const dataTypeText = selectedDataType === 'weight' ? '体重' : '体脂肪';
    return (
      <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 overflow-hidden">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="w-full justify-start p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-slate-900">体重グラフ</h3>
            </div>
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
    <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 overflow-hidden">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        className="w-full justify-start p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900">体重グラフ</h3>
          </div>
        </div>
      </Button>

      {/* グラフ内容 - 開閉可能 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 日付範囲選択 */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-2">
            <div className="flex items-center gap-1">
              <label className="text-xs text-slate-600">開始日:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPoint(null);
                }}
                className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
              />
            </div>
            <span className="text-slate-400">〜</span>
            <div className="flex items-center gap-1">
              <label className="text-xs text-slate-600">終了日:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPoint(null);
                }}
                className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
              />
            </div>
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
          {/* 軽量化: グラデーション・フィルター削除 */}

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



          
          {/* メインライン */}
          <path
            d={smoothPathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
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

          {/* 記録開始ポイント（カウンセリングデータのみの場合のみ表示） */}
          {pathPoints.length > 0 && !hasRealData && hasCounselingData && (
            <>
              <circle
                cx={pathPoints[0].x}
                cy={pathPoints[0].y}
                r="5"
                fill="white"
                stroke={currentConfig.color}
                strokeWidth="3"
              />
              <circle
                cx={pathPoints[0].x}
                cy={pathPoints[0].y}
                r="2"
                fill={currentConfig.color}
              />
              {/* スタートラベル */}
              <text
                x={pathPoints[0].x}
                y={pathPoints[0].y - 15}
                textAnchor="middle"
                className="text-xs font-bold fill-blue-600"
              >
                記録開始
              </text>
            </>
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
              />
              <circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r="10"
                fill={currentConfig.color}
                fillOpacity="0.2"
                stroke={currentConfig.color}
                strokeWidth="1"
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
              {tick.value % 1 === 0 ? tick.value.toFixed(0) : tick.value.toFixed(1)}
            </text>
          ))}
          
          {/* X軸ラベル - 期間に応じて適切に表示 */}
          {(() => {
            const filteredPoints = pathPoints.filter(point => !isNaN(point.x) && !isNaN(point.y));
            const totalPoints = filteredPoints.length;
            
            // データ量に応じて表示間隔を自動調整
            const displayInterval = Math.max(1, Math.floor(totalPoints / 8)); // 最大8個の日付を表示
            
            // 日付フォーマット関数（シンプル化）
            const formatDate = (dateStr: string) => {
              // MM/DD形式の場合はそのまま表示
              if (dateStr.includes('/') && !dateStr.includes('-')) {
                return dateStr;
              }
              
              const date = new Date(dateStr + 'T00:00:00');
              if (isNaN(date.getTime())) {
                return dateStr;
              }
              
              const month = date.getMonth() + 1;
              const day = date.getDate();
              return `${month}/${day}`;
            };
            
            return filteredPoints
              .filter((_, index) => index % displayInterval === 0 || index === filteredPoints.length - 1)
              .map((point, index) => (
                <text
                  key={`date-${index}`}
                  x={point.x}
                  y={svgHeight + 18}
                  textAnchor="middle"
                  className="text-xs fill-slate-500"
                >
                  {formatDate(point.date)}
                </text>
              ));
          })()}
        </svg>

        {/* ポップアップ */}
        {selectedPoint && (
          <div 
            className="absolute bg-slate-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl text-sm pointer-events-none z-20 border border-white/10"
            style={{
              left: selectedPoint.x - 30,
              top: selectedPoint.y - 65,
              transform: 'translateX(-50%)'
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

        {/* CSSアニメーション削除で軽量化 */}
        </div>
      )}
    </Card>
  );
}