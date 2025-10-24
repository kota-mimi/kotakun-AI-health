import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface UserGuidePageProps {
  onBack: () => void;
}

export function UserGuidePage({ onBack }: UserGuidePageProps) {
  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">使い方ガイド</h1>
          <div className="w-16"></div> {/* スペーサー */}
        </div>
      </div>

      <div className="p-4 pb-20 space-y-6">
        {/* メインコンテンツ */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="bg-white shadow-sm border border-gray-200 rounded-lg p-8 text-center mx-4">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                <BookOpen size={32} className="text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">準備中</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  使い方ガイドは現在開発中です。<br />
                  しばらくお待ちください。
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}