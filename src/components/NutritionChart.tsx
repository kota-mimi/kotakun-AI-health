import { Card } from './ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface NutritionChartProps {
  data: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    targets: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  };
  period: 'day' | 'week' | 'month';
  weeklyData: Array<{
    date: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }>;
}

export function NutritionChart({ data, period, weeklyData }: NutritionChartProps) {
  // PFCカロリー計算（1g当たり: タンパク質4kcal, 脂質9kcal, 炭水化物4kcal）
  const proteinCalories = data.protein * 4;
  const fatCalories = data.fat * 9;
  const carbsCalories = data.carbs * 4;

  // 円グラフ用データ
  const pfcData = [
    { name: 'タンパク質', value: proteinCalories, color: '#EF4444', grams: data.protein },
    { name: '脂質', value: fatCalories, color: '#F59E0B', grams: data.fat },
    { name: '炭水化物', value: carbsCalories, color: '#10B981', grams: data.carbs },
  ];

  // 比較チャート用データ
  const comparisonData = [
    {
      name: 'タンパク質',
      実際: data.protein,
      目標: data.targets.protein,
    },
    {
      name: '脂質',
      実際: data.fat,
      目標: data.targets.fat,
    },
    {
      name: '炭水化物',
      実際: data.carbs,
      目標: data.targets.carbs,
    },
  ];

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <p className="text-sm font-medium text-slate-800 mb-1">{data.name}</p>
          <div className="space-y-1">
            <div className="text-sm text-slate-600">
              カロリー: {data.value}kcal
            </div>
            <div className="text-sm text-slate-600">
              重量: {data.grams}g
            </div>
            <div className="text-sm text-slate-600">
              割合: {(proteinCalories + fatCalories + carbsCalories) > 0 ? ((data.value / (proteinCalories + fatCalories + carbsCalories)) * 100).toFixed(1) : '0.0'}%
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // 棒グラフツールチップ
  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <p className="text-sm font-medium text-slate-800 mb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-slate-600">
                  {entry.dataKey}: {entry.value}g
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (period === 'day') {
    return (
      <div className="grid grid-cols-1 gap-4">
        {/* PFCバランス円グラフ */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-4">PFCバランス (カロリー基準)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pfcData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pfcData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color, fontSize: '12px' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* 総カロリー表示 */}
          <div className="text-center mt-4 p-3 bg-gray-100 rounded-lg">
            <div className="text-sm text-slate-600 mb-1">PFCからの総カロリー</div>
            <div className="text-lg font-semibold text-slate-800">
              {proteinCalories + fatCalories + carbsCalories}kcal
            </div>
            <div className="text-xs text-slate-500">
              記録カロリー: {data.calories}kcal
            </div>
          </div>
        </Card>

        {/* 目標との比較 */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-4">目標との比較</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(value) => `${value}g`}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="実際" fill="#4682B4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="目標" fill="rgba(70, 130, 180, 0.3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  }

  // 週間・月間表示
  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
      <h3 className="font-semibold text-slate-800 mb-4">
        {period === 'week' ? '週間' : '月間'}栄養トレンド
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <Tooltip content={<BarTooltip />} />
            <Bar dataKey="protein" fill="#EF4444" radius={[2, 2, 0, 0]} />
            <Bar dataKey="fat" fill="#F59E0B" radius={[2, 2, 0, 0]} />
            <Bar dataKey="carbs" fill="#10B981" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* 凡例 */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-1 bg-red-500 rounded"></div>
          <span className="text-slate-600">タンパク質</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-1 bg-yellow-500 rounded"></div>
          <span className="text-slate-600">脂質</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-1 bg-green-500 rounded"></div>
          <span className="text-slate-600">炭水化物</span>
        </div>
      </div>
    </Card>
  );
}