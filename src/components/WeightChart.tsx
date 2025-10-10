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
  counselingResult?: any;
}

type DataType = 'weight' | 'bodyFat' | 'waist';

export function WeightChart({ data = [], period, height, targetWeight = 68.0, currentWeight = 0, counselingResult }: WeightChartProps) {
  const [selectedDataType, setSelectedDataType] = useState<DataType>('weight');
  const [selectedPoint, setSelectedPoint] = useState<{x: number, y: number, value: number, date: string} | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '6months' | 'year' | 'all'>('week');
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
  
  // 実際のデータがある場合はそれを使用、ない場合でもカウンセリング結果があれば初期データを作成
  const hasRealData = validData.length > 0;
  const hasCounselingData = counselingResult?.answers?.weight && counselingResult.answers.weight > 0;
  
  // 実際のデータとカウンセリングデータを組み合わせて返す
  const getAllChartData = () => {
    return getRealChartData();
  };

  // カウンセリング結果から初期データポイントを作成
  const createCounselingInitialData = () => {
    if (!hasCounselingData) return [];
    
    // カウンセリング完了日を使用（フォールバック：作成日、最後のフォールバック：今日）
    const counselingDateRaw = counselingResult.completedAt || counselingResult.createdAt;
    let counselingDate;
    
    // Firestoreのタイムスタンプオブジェクトかチェック
    if (counselingDateRaw?.seconds) {
      counselingDate = new Date(counselingDateRaw.seconds * 1000);
    } else if (counselingDateRaw) {
      counselingDate = new Date(counselingDateRaw);
    } else {
      counselingDate = new Date();
    }
    
    // 日付が無効な場合のフォールバック
    if (isNaN(counselingDate.getTime())) {
      console.warn('⚠️ Invalid counseling date in WeightChart:', counselingDateRaw);
      counselingDate = new Date(); // 現在の日付を使用
    }
    
    console.log('📅 カウンセリング記録開始日:', {
      raw: counselingDateRaw,
      processed: counselingDate,
      formatted: `${counselingDate.getMonth() + 1}/${counselingDate.getDate()}`
    });
    
    const dateStr = `${counselingDate.getMonth() + 1}/${counselingDate.getDate()}`;
    
    return [{
      date: dateStr,
      weight: counselingResult.answers.weight,
      bodyFat: 0 // カウンセリングでは体脂肪は取得しないのでデフォルト値
    }];
  };

  // 実際のデータを使用するか、カウンセリングデータを使用するかを決定
  const getRealChartData = () => {
    if (!hasRealData && !hasCounselingData) return [];
    if (!hasRealData && hasCounselingData) return createCounselingInitialData();
    
    
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
      // 日付が無効な場合はスキップ
      if (isNaN(itemDate.getTime())) {
        console.warn('⚠️ Invalid date in WeightChart:', item.date);
        return false;
      }
      
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

    // データがない場合は空配列を返す
    if (filteredData.length === 0) {
      return [];
    }

    // データフォーマットを統一（実際のデータはweight/bodyFatのみ、waistは仮の値）
    const processedData = filteredData.map(item => {
      const itemDate = new Date(item.date);
      // 日付が無効な場合はスキップ（フィルタで除外されているはずだが念のため）
      if (isNaN(itemDate.getTime())) {
        console.warn('⚠️ Invalid date in WeightChart processedData:', item.date);
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
        bodyFat: item.bodyFat || 0,
        waist: 80 // 仮の値（実際のデータにwaistがないため）
      };
    }).filter(item => item !== null); // null値を除外
    
    return processedData;
  };

  const chartData = getRealChartData();

  // データから適切な範囲を計算（動的スケーリング対応）
  const calculateDataRange = (dataType: DataType) => {
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
        case 'bodyFat': return { min: 10, max: 25 };
        case 'waist': return { min: 77, max: 87 };
      }
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const center = (min + max) / 2;
    const actualRange = max - min;
    
    // 体重の場合は動的スケーリング
    if (dataType === 'weight') {
      // 単一データポイントの場合の処理
      if (values.length === 1) {
        const singleValue = values[0];
        return {
          min: singleValue - 2, // 単一ポイントなら±2kgの範囲で表示
          max: singleValue + 2
        };
      }
      
      // 実際のデータの範囲に応じて適切な表示範囲を決定
      let displayRange;
      
      if (actualRange <= 0.1) {
        // 0.1kg以下の変化なら1kg幅で表示（非常に細かい変化）
        displayRange = 1;
      } else if (actualRange <= 1) {
        // 1kg以下の変化なら2kg幅で表示（細かい変化を見やすく）
        displayRange = 2;
      } else if (actualRange <= 2) {
        // 2kg以下の変化なら3kg幅で表示
        displayRange = 3;
      } else if (actualRange <= 5) {
        // 5kg以下の変化なら従来の5kg幅
        displayRange = 5;
      } else if (actualRange <= 10) {
        // 10kg以下の変化なら8kg幅（少し余裕を持たせる）
        displayRange = Math.max(8, actualRange * 1.3);
      } else {
        // 大きな変化の場合は実際の範囲の1.3倍を表示（上下に余裕を持たせる）
        displayRange = actualRange * 1.3;
      }
      
      return {
        min: center - displayRange / 2,
        max: center + displayRange / 2
      };
    }
    
    // 体脂肪の場合
    if (dataType === 'bodyFat') {
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
  };

  const dataTypeConfig = {
    weight: { label: '体重', unit: 'kg', color: '#3B82F6', ...calculateDataRange('weight') },
    bodyFat: { label: '体脂肪', unit: '%', color: '#F97316', ...calculateDataRange('bodyFat') },
  };

  const currentConfig = dataTypeConfig[selectedDataType];
  const currentData = chartData.map(item => ({
    date: item.date,
    value: item[selectedDataType]
  })).filter(item => {
    // 体重の場合は0より大きい値のみ、体脂肪の場合は0以上の値を許可
    if (selectedDataType === 'weight') {
      return item.value != null && item.value > 0;
    } else {
      return item.value != null && item.value >= 0;
    }
  });
  

  const chartRange = currentConfig.max - currentConfig.min;

  // SVGパスを生成
  const svgWidth = 320;
  const svgHeight = 180;
  
  // データ数に応じて適切な間隔を計算
  const calculateXPositions = () => {
    if (currentData.length === 0) return [];
    if (currentData.length === 1) return [svgWidth / 2];
    
    // 1日あたりの固定幅を設定（40px程度）
    const dayWidth = 40;
    const totalDataWidth = (currentData.length - 1) * dayWidth;
    
    // グラフエリアの最大幅（マージンを考慮）
    const maxGraphWidth = svgWidth - 10;
    
    // データが少ない場合は固定幅、多い場合は圧縮
    const actualWidth = Math.min(totalDataWidth, maxGraphWidth);
    const startX = 5 + (maxGraphWidth - actualWidth) / 2; // 中央揃え
    
    return currentData.map((_, index) => {
      if (currentData.length === 1) return svgWidth / 2;
      return startX + (index / (currentData.length - 1)) * actualWidth;
    });
  };
  
  const xPositions = calculateXPositions();
  const pathPoints = currentData.length > 0 ? currentData.map((point, index) => {
    const x = xPositions[index];
    const y = 10 + (svgHeight - 25) - ((point.value - currentConfig.min) / chartRange) * (svgHeight - 25);
    
    // NaN値をチェック
    const safeX = isNaN(x) ? 0 : x;
    const safeY = isNaN(y) ? svgHeight / 2 : y;
    
    return { x: safeX, y: safeY, value: point.value, date: point.date };
  }) : [];
  
  // 滑らかなベジェ曲線を生成
  const createSmoothPath = (points: typeof pathPoints) => {
    if (points.length < 2) return '';
    
    // 同じ値の場合は直線で描画（有効なデータポイントが2つ以上ある場合のみチェック）
    const allSameValue = points.length >= 2 && points.every(p => Math.abs(p.value - points[0].value) < 0.01);
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    if (allSameValue) {
      // 同じ値なら直線で接続
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x},${points[i].y}`;
      }
      return path;
    }
    
    // 値に変化がある場合は滑らかなベジェ曲線
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

  // Y軸の目盛りを生成（動的範囲対応）
  const generateYAxisTicks = () => {
    const range = currentConfig.max - currentConfig.min;
    
    // 適切な間隔を決定（より細かく調整）
    let tickInterval;
    if (range <= 1.5) {
      tickInterval = 0.2; // 1.5kg以下なら0.2kg刻み（より細かく）
    } else if (range <= 2.5) {
      tickInterval = 0.5; // 2.5kg以下なら0.5kg刻み
    } else if (range <= 5) {
      tickInterval = 1; // 5kg以下なら1kg刻み
    } else if (range <= 10) {
      tickInterval = 2; // 10kg以下なら2kg刻み
    } else if (range <= 20) {
      tickInterval = 5; // 20kg以下なら5kg刻み
    } else {
      tickInterval = 10; // それ以上なら10kg刻み（大きな変化に対応）
    }
    
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

  const yAxisTicks = generateYAxisTicks();

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

          {/* 記録開始ポイント（最初のポイント）を常に表示 */}
          {pathPoints.length > 0 && (
            <>
              <circle
                cx={pathPoints[0].x}
                cy={pathPoints[0].y}
                r="5"
                fill="white"
                stroke={currentConfig.color}
                strokeWidth="3"
                filter="url(#dropshadow)"
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
              {tick.value % 1 === 0 ? tick.value.toFixed(0) : tick.value.toFixed(1)}
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