import React, { useState, useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface WeightChartProps {
  data: Array<{
    date: string;
    weight: number;
    note?: string;
  }>;
  period: "week" | "month" | "6months" | "year";
  height: number;
  targetWeight?: number;
  currentWeight?: number;
  counselingResult?: any;
  onOpenWeightEntry?: () => void;
}

export function WeightChart({
  data = [],
  period,
  height,
  targetWeight = 68.0,
  currentWeight = 0,
  counselingResult,
  onOpenWeightEntry,
}: WeightChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "6months" | "year" | "all"
  >("month");
  const [isExpanded, setIsExpanded] = useState(true);

  // 軽量データ処理（重い計算なし）
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // フィルタリング（間引き処理削除）
    return data
      .filter(item => item && item.weight && item.weight > 0)
      .map(item => ({
        date: item.date,
        weight: item.weight,
        displayDate: new Date(item.date).toLocaleDateString('ja-JP', { 
          month: 'numeric', 
          day: 'numeric' 
        })
      }));
  }, [data]);

  // データがない場合の表示
  if (chartData.length === 0) {
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

        {isExpanded && (
          <div className="p-4">
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-slate-600 text-base font-medium mb-2">
                体重データがまだありません
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                体重を記録すると、推移がグラフで表示されます
              </p>
              <div className="mt-4">
                <button 
                  onClick={onOpenWeightEntry}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  体重を記録する
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  // 軽量SVGグラフ（日付間隔狭い）
  const svgWidth = 280;
  const svgHeight = 120;
  
  const weights = chartData.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;
  
  // 狭い間隔で配置（30px間隔）
  const points = chartData.map((d, index) => {
    const x = 20 + index * 30; // 狭い間隔
    const y = 20 + (1 - (d.weight - minWeight) / weightRange) * (svgHeight - 40);
    return { x, y, weight: d.weight, date: d.displayDate };
  });
  
  // 直線パス（スプライン曲線削除）
  const pathData = points.length > 0 
    ? `M ${points[0].x},${points[0].y} ` + 
      points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')
    : '';

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
          {onOpenWeightEntry && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onOpenWeightEntry();
              }}
              size="sm"
              className="h-8 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white"
            >
              記録
            </Button>
          )}
        </div>
      </Button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 期間選択 */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            {[
              { key: "month", label: "1ヶ月" },
              { key: "6months", label: "3ヶ月" },
              { key: "all", label: "全期間" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedPeriod(key as any)}
                className={`flex-1 px-1 py-1 text-xs font-medium rounded-md ${
                  selectedPeriod === key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 軽量グラフ（マウスホバー削除） */}
          <div className="relative bg-gray-50 rounded-lg p-3">
            <svg width="100%" height="140" viewBox={`0 0 ${svgWidth} ${svgHeight + 20}`}>
              {/* 直線のみ（スプライン削除） */}
              {pathData && (
                <path
                  d={pathData}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* 体重数値表示 */}
              {points.map((point, index) => (
                <text
                  key={index}
                  x={point.x}
                  y={point.y - 8}
                  textAnchor="middle"
                  className="text-xs font-bold fill-slate-700"
                >
                  {point.weight.toFixed(1)}
                </text>
              ))}
              
              {/* 日付表示（狭い間隔） */}
              {points.map((point, index) => (
                <text
                  key={index}
                  x={point.x}
                  y={svgHeight + 15}
                  textAnchor="middle"
                  className="text-xs fill-slate-500"
                >
                  {point.date}
                </text>
              ))}
            </svg>
          </div>
        </div>
      )}
    </Card>
  );
}