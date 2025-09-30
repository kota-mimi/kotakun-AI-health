import { Card } from './ui/card';

interface SimpleWeightChartProps {
  className?: string;
}

export function SimpleWeightChart({ className = "" }: SimpleWeightChartProps) {
  // ダミーデータ（75.2kg → 72.5kg の減量）
  const weightData = [
    { date: '12/1', weight: 75.2 },
    { date: '12/5', weight: 74.5 },
    { date: '12/10', weight: 74.0 },
    { date: '12/15', weight: 73.5 },
    { date: '12/20', weight: 72.9 },
    { date: '12/25', weight: 72.5 },
    { date: '1/30', weight: 72.5 }
  ];

  const targetWeight = 68.0;
  const maxWeight = 76;
  const minWeight = 67;
  const chartRange = maxWeight - minWeight;

  // SVGパスを生成
  const svgWidth = 280;
  const svgHeight = 120;
  const pathPoints = weightData.map((point, index) => {
    const x = (index / (weightData.length - 1)) * svgWidth;
    const y = svgHeight - ((point.weight - minWeight) / chartRange) * svgHeight;
    return `${x},${y}`;
  });
  const pathData = `M ${pathPoints.join(' L ')}`;

  // 目標体重のライン
  const targetY = svgHeight - ((targetWeight - minWeight) / chartRange) * svgHeight;

  return (
    <Card className="bg-white/90 border border-slate-200/50 rounded-xl p-3">
      <h4 className="text-slate-800 mb-3">体重推移</h4>
      
      <div className="relative">
        <svg width="100%" height="140" viewBox={`0 0 ${svgWidth} ${svgHeight + 20}`}>
          {/* 目標体重ライン */}
          <line
            x1="0"
            y1={targetY}
            x2={svgWidth}
            y2={targetY}
            stroke="#EF4444"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.6"
          />
          
          {/* メインライン */}
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* データポイント */}
          {weightData.map((point, index) => {
            const x = (index / (weightData.length - 1)) * svgWidth;
            const y = svgHeight - ((point.weight - minWeight) / chartRange) * svgHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#3B82F6"
              />
            );
          })}
          
          {/* X軸ラベル */}
          {weightData.map((point, index) => {
            if (index % 2 === 0) {
              const x = (index / (weightData.length - 1)) * svgWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={svgHeight + 15}
                  textAnchor="middle"
                  className="text-xs fill-slate-500"
                >
                  {point.date}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
    </Card>
  );
}