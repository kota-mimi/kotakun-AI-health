import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  BookOpen, 
  Play,
  FileText,
  MessageCircle,
  Smartphone,
  Target,
  BarChart3,
  ChevronRight,
  Video,
  HelpCircle
} from 'lucide-react';

interface UserGuidePageProps {
  onBack: () => void;
}

export function UserGuidePage({ onBack }: UserGuidePageProps) {
  const guideCategories = [
    {
      id: 'getting-started',
      title: '基本的な使い方',
      description: 'アプリの基本機能を覚えよう',
      icon: Smartphone,
      color: '#4682B4',
      items: [
        { title: '初期設定と目標設定', type: 'video', duration: '3分' },
        { title: 'ホーム画面の見方', type: 'text', readTime: '2分' },
        { title: 'プロフィール設定', type: 'text', readTime: '1分' }
      ]
    },
    {
      id: 'recording',
      title: '記録方法',
      description: '食事・運動・体重の記録方法',
      icon: Target,
      color: '#10B981',
      items: [
        { title: '食事記録の付け方', type: 'video', duration: '5分' },
        { title: '運動記録の基本', type: 'video', duration: '4分' },
        { title: '体重記録のコツ', type: 'text', readTime: '2分' },
        { title: 'カメラでの食事記録', type: 'video', duration: '3分' }
      ]
    },
    {
      id: 'analysis',
      title: '分析・レポート',
      description: 'データを活用して目標達成',
      icon: BarChart3,
      color: '#F59E0B',
      items: [
        { title: 'レポートの見方', type: 'text', readTime: '3分' },
        { title: 'PFCバランスの理解', type: 'video', duration: '6分' },
        { title: 'AI分析結果の活用', type: 'text', readTime: '4分' }
      ]
    }
  ];

  const faqItems = [
    {
      question: 'カロリー計算はどのように行われますか？',
      answer: '食品データベースとAI画像解析を組み合わせて、正確なカロリー計算を行っています。'
    },
    {
      question: '目標体重の設定方法は？',
      answer: 'プロフィール設定から目標体重と達成期限を設定できます。健康的な減量ペースをおすすめします。'
    },
    {
      question: 'データのバックアップは？',
      answer: 'すべてのデータはクラウドに自動保存されます。機種変更時もデータを引き継げます。'
    },
    {
      question: '家族で使うことはできますか？',
      answer: 'ファミリープランをご利用いただくと、最大6人まで利用できます。'
    }
  ];

  const renderGuideCategory = (category: any) => (
    <Card key={category.id} className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl overflow-hidden">
      <div className="px-4 pt-2 pb-0 border-b border-white/40 bg-white/40">
        <div className="flex items-center space-x-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{backgroundColor: `${category.color}15`}}
          >
            <category.icon size={16} style={{color: category.color}} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{category.title}</h3>
            <p className="text-xs text-slate-500">{category.description}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-white/30">
        {category.items.map((item: any, index: number) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start pt-2 pb-4 px-4 h-auto hover:bg-white/60 rounded-none"
            onClick={() => console.log(`ガイド開く: ${item.title}`)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  {item.type === 'video' ? (
                    <Video size={14} className="text-slate-600" />
                  ) : (
                    <FileText size={14} className="text-slate-600" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-800 text-sm">{item.title}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.type === 'video' ? 'ビデオ' : 'テキスト'}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {item.duration || item.readTime}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 max-w-sm mx-auto relative">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-50/20 pointer-events-none" style={{background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.1) 0%, transparent 50%, rgba(70, 130, 180, 0.05) 100%)'}}></div>
      
      {/* ヘッダー */}
      <div className="relative px-4 pt-4 pb-2">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-white/60"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">使い方ガイド</h1>
            <p className="text-sm text-slate-600">アプリの使い方・機能説明</p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative px-4 py-2 pb-20 space-y-4">
        {/* クイックスタート */}
        <Card className="backdrop-blur-xl bg-health-primary/10 shadow-lg border border-health-primary/30 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Play size={16} className="text-health-primary" />
              <h3 className="font-semibold text-slate-800">クイックスタート</h3>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              初めての方はこちらから始めましょう
            </p>
            <Button 
              className="w-full bg-health-primary hover:bg-health-primary-dark text-white"
              onClick={() => console.log('クイックスタート開始')}
            >
              <Play size={16} className="mr-2" />
              5分でわかる基本操作
            </Button>
          </div>
        </Card>

        {/* ガイドカテゴリ */}
        {guideCategories.map(category => renderGuideCategory(category))}

        {/* よくある質問 */}
        <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl overflow-hidden">
          <div className="px-4 pt-2 pb-0 border-b border-white/40 bg-white/40">
            <div className="flex items-center space-x-2">
              <HelpCircle size={16} className="text-slate-600" />
              <h3 className="font-semibold text-slate-800">よくある質問</h3>
            </div>
          </div>
          <div className="divide-y divide-white/30">
            {faqItems.map((faq, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start pt-2 pb-4 px-4 h-auto hover:bg-white/60 rounded-none"
                onClick={() => console.log(`FAQ開く: ${faq.question}`)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="text-left">
                    <p className="font-medium text-slate-800 text-sm">{faq.question}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 flex-shrink-0 ml-2" />
                </div>
              </Button>
            ))}
          </div>
          <div className="p-4 border-t border-white/30">
            <Button variant="outline" className="w-full" onClick={() => console.log('FAQ一覧')}>
              すべてのFAQを見る
            </Button>
          </div>
        </Card>

        {/* その他のヘルプ */}
        <Card className="backdrop-blur-xl bg-slate-50/80 shadow-lg border border-slate-200/50 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MessageCircle size={16} className="text-slate-600" />
              <h4 className="font-semibold text-slate-800">その他のサポート</h4>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => console.log('ライブチャット')}>
                <MessageCircle size={16} className="mr-2" />
                ライブチャットサポート
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => console.log('メールサポート')}>
                <FileText size={16} className="mr-2" />
                メールでお問い合わせ
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}