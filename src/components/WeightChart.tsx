import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
// 簡易日付フォーマット関数（年を除く）
const formatDate = (dateString: string, period: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // すべての期間で年を表示しない
  return `${month}/${day}`;
};

interface WeightChartProps {
  data: Array<{
    date: string;
    weight: number;
    bodyFat?: number;
    morningWeight?: number;
    eveningWeight?: number;
    note?: string;
  }>;
  period: 'week' | 'month' | '6months' | 'year';
  height: number;
  targetWeight?: number;
}

export function WeightChart({ data, period, height, targetWeight = 68.0 }: WeightChartProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [visibleLines, setVisibleLines] = useState({
    weight: true,
    bodyFat: false,
    morningWeight: false,
    eveningWeight: false
  });
  const optionsRef = useRef<HTMLDivElement>(null);

  const toggleLine = (lineType: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineType]: !prev[lineType]
    }));
  };

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);
  // 期間に応じてデータをフィルタリング
  const filterDataByPeriod = () => {
    const now = new Date();
    const periodDays = {
      week: 7,
      month: 30,
      '6months': 180,
      year: 365
    };
    
    const startDate = new Date(now.getTime() - (periodDays[period] * 24 * 60 * 60 * 1000));
    const filteredData = data.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate;
    });
    
    return filteredData.map(entry => ({
      ...entry,
      formattedDate: formatDate(entry.date, period)
    }));
  };

  const chartData = filterDataByPeriod();

  // Y軸の範囲を計算（体重データのみ。体脂肪率は除外）
  const getWeightValues = () => {
    const values = [targetWeight];
    chartData.forEach(d => {
      if (visibleLines.weight) values.push(d.weight);
      if (visibleLines.morningWeight && d.morningWeight) values.push(d.morningWeight);
      if (visibleLines.eveningWeight && d.eveningWeight) values.push(d.eveningWeight);
    });
    return values;
  };

  const weightValues = getWeightValues();
  const minWeight = Math.min(...weightValues);
  const maxWeight = Math.max(...weightValues);
  const padding = (maxWeight - minWeight) * 0.1 || 1;
  const yAxisMin = Math.max(0, minWeight - padding);
  const yAxisMax = maxWeight + padding;

  // 体脂肪率用の個別Y軸設定
  const getBodyFatRange = () => {
    if (!visibleLines.bodyFat) return { min: 0, max: 30 };
    
    const bodyFatValues = chartData
      .filter(d => d.bodyFat)
      .map(d => d.bodyFat!);
    
    if (bodyFatValues.length === 0) return { min: 0, max: 30 };
    
    const min = Math.min(...bodyFatValues);
    const max = Math.max(...bodyFatValues);
    const range = max - min;
    const padding = range * 0.2 || 2;
    
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    };
  };

  const bodyFatRange = getBodyFatRange();

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-white/40 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-medium text-slate-800 mb-1">{label}</p>
          <div className="space-y-1">
            {visibleLines.weight && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm text-slate-600">体重: {data.weight}kg</span>
              </div>
            )}
            {visibleLines.morningWeight && data.morningWeight && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-slate-600">朝の体重: {data.morningWeight}kg</span>
              </div>
            )}
            {visibleLines.eveningWeight && data.eveningWeight && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-sm text-slate-600">夜の体重: {data.eveningWeight}kg</span>
              </div>
            )}
            {visibleLines.bodyFat && data.bodyFat && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-sm text-slate-600">体脂肪率: {data.bodyFat}%</span>
              </div>
            )}
            {data.note && (
              <p className="text-xs text-slate-500 mt-1">{data.note}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // BMI計算
  const calculateBMI = (weight: number) => {
    const heightInM = height / 100;
    return weight / (heightInM * heightInM);
  };

  // BMI基準線
  const normalWeightMax = 25 * Math.pow(height / 100, 2);
  const normalWeightMin = 18.5 * Math.pow(height / 100, 2);

  // 現在の体重を取得（最新のデータから）
  const currentWeight = data.length > 0 ? data[data.length - 1].weight : 0;

  return (
    <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">体重の推移</h3>
        
        {/* オプションボタン */}
        <div className="relative" ref={optionsRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 rounded-lg hover:bg-white/60"
          >
            <MoreHorizontal size={16} className="text-slate-600" />
          </Button>
          
          {/* オプションメニュー */}
          {showOptions && (
            <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-sm border border-white/40 rounded-xl p-3 shadow-lg z-10 min-w-32">
              <div className="space-y-2">
                <button
                  onClick={() => toggleLine('weight')}
                  className={`flex items-center justify-between w-full text-sm px-2 py-1 rounded transition-colors ${
                    visibleLines.weight 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>体重</span>
                  <div className={`w-3 h-3 rounded ${visibleLines.weight ? 'bg-blue-500' : 'border border-slate-300'}`}></div>
                </button>
                
                <button
                  onClick={() => toggleLine('morningWeight')}
                  className={`flex items-center justify-between w-full text-sm px-2 py-1 rounded transition-colors ${
                    visibleLines.morningWeight 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>朝の体重</span>
                  <div className={`w-3 h-3 rounded ${visibleLines.morningWeight ? 'bg-green-500' : 'border border-slate-300'}`}></div>
                </button>
                
                <button
                  onClick={() => toggleLine('eveningWeight')}
                  className={`flex items-center justify-between w-full text-sm px-2 py-1 rounded transition-colors ${
                    visibleLines.eveningWeight 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>夜の体重</span>
                  <div className={`w-3 h-3 rounded ${visibleLines.eveningWeight ? 'bg-purple-500' : 'border border-slate-300'}`}></div>
                </button>
                
                <button
                  onClick={() => toggleLine('bodyFat')}
                  className={`flex items-center justify-between w-full text-sm px-2 py-1 rounded transition-colors ${
                    visibleLines.bodyFat 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>体脂肪率</span>
                  <div className={`w-3 h-3 rounded ${visibleLines.bodyFat ? 'bg-orange-500' : 'border border-slate-300'}`}></div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 15, bottom: 20 }}>
            {/* グラデーション定義 */}
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="morningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="eveningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
              
              {/* ドロップシャドウフィルター */}
              <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
              </filter>
              
              {/* グロー効果 */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="1 3" 
              stroke="rgba(148, 163, 184, 0.15)"
              horizontal={true}
              vertical={false}
              strokeWidth={0.8}
            />
            
            <XAxis 
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#64748B', 
                fontWeight: 500 
              }}
              interval={period === 'week' ? 0 : 'preserveStartEnd'}
              dy={5}
            />
            
            <YAxis 
              yAxisId="weight"
              domain={[yAxisMin, yAxisMax]}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#64748B', 
                fontWeight: 500 
              }}
              tickFormatter={(value) => `${value.toFixed(1)}`}
              width={35}
              dx={-10}
            />
            
            {/* 体脂肪率用の右側Y軸 */}
            {visibleLines.bodyFat && (
              <YAxis 
                yAxisId="bodyFat"
                orientation="right"
                domain={[bodyFatRange.min, bodyFatRange.max]}
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 11, 
                  fill: '#F59E0B', 
                  fontWeight: 500 
                }}
                tickFormatter={(value) => `${value}%`}
                width={35}
                dx={10}
              />
            )}
            
            {/* 目標体重線 - より洗練されたスタイル */}
            <ReferenceLine 
              yAxisId="weight"
              y={targetWeight} 
              stroke="#EF4444" 
              strokeDasharray="6 4" 
              strokeOpacity={0.7}
              strokeWidth={2.5}
              filter="url(#dropshadow)"
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ 
                stroke: 'rgba(59, 130, 246, 0.2)', 
                strokeWidth: 2,
                strokeDasharray: '5 5'
              }}
            />
            
            {/* 体重ライン - メインライン */}
            {visibleLines.weight && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                stroke="#3B82F6"
                strokeWidth={4}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  stroke: '#3B82F6', 
                  strokeWidth: 3, 
                  fill: '#FFFFFF',
                  filter: 'url(#glow)',
                  style: { cursor: 'pointer' }
                }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            )}
            
            {/* 朝の体重ライン */}
            {visibleLines.morningWeight && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="morningWeight"
                stroke="#10B981"
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 5, 
                  stroke: '#10B981', 
                  strokeWidth: 2, 
                  fill: '#FFFFFF',
                  filter: 'url(#dropshadow)',
                  style: { cursor: 'pointer' }
                }}
                strokeDasharray="8 4"
                animationDuration={1200}
                animationEasing="ease-out"
              />
            )}
            
            {/* 夜の体重ライン */}
            {visibleLines.eveningWeight && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="eveningWeight"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 5, 
                  stroke: '#8B5CF6', 
                  strokeWidth: 2, 
                  fill: '#FFFFFF',
                  filter: 'url(#dropshadow)',
                  style: { cursor: 'pointer' }
                }}
                strokeDasharray="10 5"
                animationDuration={1400}
                animationEasing="ease-out"
              />
            )}
            
            {/* 体脂肪率ライン */}
            {visibleLines.bodyFat && (
              <Line
                yAxisId="bodyFat"
                type="monotone"
                dataKey="bodyFat"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 5, 
                  stroke: '#F59E0B', 
                  strokeWidth: 2, 
                  fill: '#FFFFFF',
                  filter: 'url(#dropshadow)',
                  style: { cursor: 'pointer' }
                }}
                strokeDasharray="6 3"
                animationDuration={1600}
                animationEasing="ease-out"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        
        {/* グラフ上のグラデーション装飾 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg"></div>
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white/10 to-transparent rounded-b-lg"></div>
        </div>
      </div>
    </Card>
  );
}