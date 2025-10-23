import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Edit2, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  StickyNote,
  Camera,
  MoreVertical
} from 'lucide-react';
// 簡易日付フォーマット関数
const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const formatFullDate = (date: Date) => {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface WeightHistoryProps {
  data: Array<{
    date: string;
    weight: number;
    bodyFat?: number;
    note?: string;
    photo?: string;
  }>;
  onEdit: (entry: any) => void;
  onDelete: (entryId: string) => void;
}

export function WeightHistory({ data, onEdit, onDelete }: WeightHistoryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // データを日付順でソート（新しい順）
  const sortedData = [...data].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 前日との変化を計算
  const getWeightChange = (currentWeight: number, index: number) => {
    if (index === sortedData.length - 1) return null; // 最初の記録
    const previousWeight = sortedData[index + 1].weight;
    return currentWeight - previousWeight;
  };

  // 日付フォーマット
  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) return '今日';
    if (isYesterday(date)) return '昨日';
    
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    
    return `${month}月${day}日(${weekday})`;
  };

  const formatFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatFullDate(date);
  };

  const toggleExpanded = (dateString: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(dateString)) {
      newExpanded.delete(dateString);
    } else {
      newExpanded.add(dateString);
    }
    setExpandedItems(newExpanded);
  };

  if (sortedData.length === 0) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
        <div className="text-center space-y-4">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{backgroundColor: 'rgba(70, 130, 180, 0.1)'}}
          >
            <Calendar size={24} style={{color: '#4682B4'}} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">記録がありません</h3>
            <p className="text-sm text-slate-600">体重を記録して履歴を確認しましょう</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">記録履歴</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {sortedData.length}件
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedData.map((entry, index) => {
          const weightChange = getWeightChange(entry.weight, index);
          const isExpanded = expandedItems.has(entry.date);
          
          return (
            <div 
              key={entry.date}
              className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden transition-all duration-200"
            >
              {/* メイン表示 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {/* 左側：日付と体重 */}
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-800">
                        {formatDateLabel(entry.date)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatTime(new Date(entry.date))}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-800">{entry.weight}kg</p>
                      {weightChange !== null && (
                        <div className="flex items-center space-x-1">
                          {weightChange < 0 ? (
                            <TrendingDown size={12} className="text-green-500" />
                          ) : weightChange > 0 ? (
                            <TrendingUp size={12} className="text-red-500" />
                          ) : (
                            <div className="w-3 h-0.5 bg-slate-400 rounded"></div>
                          )}
                          <span 
                            className={`text-xs font-medium ${
                              weightChange < 0 ? 'text-green-600' : 
                              weightChange > 0 ? 'text-red-600' : 'text-slate-600'
                            }`}
                          >
                            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右側：追加情報とアクション */}
                  <div className="flex items-center space-x-2">
                    {/* 体脂肪率 */}
                    {entry.bodyFat && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                        {entry.bodyFat}%
                      </Badge>
                    )}
                    
                    {/* メモアイコン */}
                    {entry.note && (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <StickyNote size={12} className="text-green-600" />
                      </div>
                    )}
                    
                    {/* 写真アイコン */}
                    {entry.photo && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Camera size={12} className="text-blue-600" />
                      </div>
                    )}

                    {/* 展開ボタン */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(entry.date)}
                      className="p-1 h-6 w-6 rounded-lg hover:bg-gray-100"
                    >
                      <MoreVertical size={12} className="text-slate-400" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 展開エリア */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-100 p-4 space-y-3">
                  {/* 詳細情報 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">記録日時</span>
                      <span className="font-medium text-slate-800">{formatFullDateTime(entry.date)}</span>
                    </div>
                    
                    {entry.bodyFat && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">体脂肪率</span>
                        <span className="font-medium text-amber-700">{entry.bodyFat}%</span>
                      </div>
                    )}
                    
                    {entry.note && (
                      <div className="text-sm">
                        <span className="text-slate-600 block mb-1">メモ</span>
                        <p className="text-slate-800 bg-gray-100 rounded-lg p-2">{entry.note}</p>
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(entry)}
                      className="flex-1 rounded-lg border-slate-200 hover:bg-gray-100"
                    >
                      <Edit2 size={14} className="mr-1" />
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(entry.date)}
                      className="flex-1 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1" />
                      削除
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* フッター統計 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500 mb-1">記録期間</p>
            <p className="text-sm font-medium text-slate-700">
              {Math.ceil((new Date().getTime() - new Date(sortedData[sortedData.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))}日
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">平均間隔</p>
            <p className="text-sm font-medium text-slate-700">
              {sortedData.length > 1 ? 
                Math.round(
                  (new Date(sortedData[0].date).getTime() - new Date(sortedData[sortedData.length - 1].date).getTime()) 
                  / (1000 * 60 * 60 * 24 * (sortedData.length - 1))
                ) : 0
              }日
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">総変化</p>
            <p className={`text-sm font-medium ${
              sortedData[0].weight - sortedData[sortedData.length - 1].weight < 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {sortedData[0].weight - sortedData[sortedData.length - 1].weight > 0 ? '+' : ''}
              {(sortedData[0].weight - sortedData[sortedData.length - 1].weight).toFixed(1)}kg
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}