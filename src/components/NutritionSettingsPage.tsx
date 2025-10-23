import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { CompactHeader } from './CompactHeader';
import { 
  ArrowLeft,
  Settings,
  Target,
  Info,
  Check,
  X
} from 'lucide-react';

interface NutritionSettingsPageProps {
  onBack: () => void;
  selectedNutrients: Record<string, boolean>;
  onNutrientChange: (nutrients: Record<string, boolean>) => void;
}

export function NutritionSettingsPage({ 
  onBack, 
  selectedNutrients, 
  onNutrientChange 
}: NutritionSettingsPageProps) {
  const [tempSelected, setTempSelected] = useState(selectedNutrients);

  const nutritionCategories = [
    {
      title: '基本栄養素',
      description: 'PFCバランスの基本となる必須栄養素',
      items: [
        { key: 'protein', label: 'タンパク質', description: '筋肉の維持・増強に必要', unit: 'g', color: '#EF4444', default: true },
        { key: 'fat', label: '脂質', description: 'エネルギー源として重要', unit: 'g', color: '#F59E0B', default: true },
        { key: 'carbs', label: '炭水化物', description: '脳と筋肉のエネルギー源', unit: 'g', color: '#3B82F6', default: true }
      ]
    },
    {
      title: '炭水化物詳細',
      description: '炭水化物の内訳を詳しく分析',
      items: [
        { key: 'fiber', label: '食物繊維', description: '腸内環境の改善', unit: 'g', color: '#10B981' },
        { key: 'sugar', label: '糖質', description: '炭水化物の内訳を確認', unit: 'g', color: '#F97316' }
      ]
    },
    {
      title: 'ミネラル',
      description: '体の機能維持に重要な無機質',
      items: [
        { key: 'sodium', label: '塩分（ナトリウム）', description: '血圧管理に重要', unit: 'mg', color: '#8B5CF6' },
        { key: 'calcium', label: 'カルシウム', description: '骨や歯の健康維持', unit: 'mg', color: '#06B6D4' },
        { key: 'potassium', label: 'カリウム', description: '血圧調整とむくみ予防', unit: 'mg', color: '#84CC16' },
        { key: 'iron', label: '鉄分', description: '貧血予防と酸素運搬', unit: 'mg', color: '#DC2626' },
        { key: 'magnesium', label: 'マグネシウム', description: '筋肉と神経の正常な機能', unit: 'mg', color: '#34D399' }
      ]
    },
    {
      title: 'アミノ酸・ビタミン',
      description: '代謝とエネルギー効率をサポート',
      items: [
        { key: 'bcaa', label: 'BCAA / 必須アミノ酸', description: '筋肉疲労回復をサポート', unit: 'g', color: '#F59E0B' },
        { key: 'vitaminD', label: 'ビタミンD', description: 'カルシウム吸収を促進', unit: 'μg', color: '#FBBF24' },
        { key: 'vitaminB', label: 'ビタミンB群', description: 'エネルギー代謝をサポート', unit: 'mg', color: '#A78BFA' }
      ]
    },
    {
      title: '水分量',
      description: '1日の水分摂取量管理',
      items: [
        { key: 'water', label: '水分量', description: '1日の摂取量を確認', unit: 'ml', color: '#60A5FA' }
      ]
    }
  ];

  const toggleNutrient = (nutrientKey: string) => {
    setTempSelected(prev => ({
      ...prev,
      [nutrientKey]: !prev[nutrientKey]
    }));
  };

  const handleSave = () => {
    onNutrientChange(tempSelected);
    onBack();
  };

  const handleReset = () => {
    setTempSelected(selectedNutrients);
  };

  const getSelectedCount = () => {
    return Object.values(tempSelected).filter(Boolean).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-sm mx-auto relative">
      {/* 背景装飾 */}
      
      {/* ヘッダー */}
      <CompactHeader
        currentDate={new Date()}
        onDateSelect={() => {}}
        onCalendar={() => {}}
        customContent={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-700 hover:bg-gray-100 rounded-lg p-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="text-center flex-1">
              <h1 className="font-semibold text-slate-800">栄養素設定</h1>
              <p className="text-xs text-slate-600">表示する栄養素を選択</p>
            </div>
            <div className="w-8"></div>
          </div>
        }
      />

      {/* メインコンテンツ */}
      <div className="relative px-4 py-4 pb-24 space-y-4">
        {/* 概要カード */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Settings size={20} style={{color: '#4682B4'}} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">栄養素追跡設定</h3>
                <p className="text-xs text-slate-600">追跡したい栄養素を選択してください</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gray-100 rounded-lg">
              <div className="text-lg font-semibold text-slate-800">{getSelectedCount()}</div>
              <div className="text-xs text-slate-600">選択中の栄養素</div>
            </div>
            <div className="text-center p-3 bg-gray-100 rounded-lg">
              <div className="text-lg font-semibold" style={{color: '#4682B4'}}>
                {nutritionCategories.reduce((total, cat) => total + cat.items.length, 0)}
              </div>
              <div className="text-xs text-slate-600">利用可能な栄養素</div>
            </div>
          </div>
        </Card>

        {/* 栄養素カテゴリ別設定 */}
        {nutritionCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Target size={16} style={{color: '#4682B4'}} />
              <h3 className="font-semibold text-slate-800">{category.title}</h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-4">{category.description}</p>
            
            <div className="space-y-3">
              {category.items.map((item, itemIndex) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors">
                  <div className="flex-1 mr-3">
                    <div className="flex items-center space-x-3 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <h4 className="font-medium text-slate-800">{item.label}</h4>
                      {item.default && (
                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          基本
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{item.description}</p>
                    <div className="text-xs text-slate-500">単位: {item.unit}</div>
                  </div>
                  <Switch
                    checked={tempSelected[item.key]}
                    onCheckedChange={() => toggleNutrient(item.key)}
                    className="ml-3"
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* 情報カード */}
        <Card className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mt-1">
              <Info size={14} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 mb-2">💡 使用のヒント</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <p>• 基本栄養素（PFC）は健康管理の基本として推奨</p>
                <p>• 特定の目標がある場合は関連する栄養素を追加</p>
                <p>• 多すぎると管理が複雑になるため適度な選択を</p>
                <p>• いつでも設定変更可能です</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-sm mx-auto">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50"
          >
            <X size={14} className="mr-2" />
            リセット
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="flex-1 text-white"
            style={{backgroundColor: '#4682B4'}}
          >
            <Check size={14} className="mr-2" />
            保存する
          </Button>
        </div>
      </div>
    </div>
  );
}