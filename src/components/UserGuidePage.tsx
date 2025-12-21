import { useState, useRef, useEffect } from 'react';
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
  HelpCircle,
  Camera,
  CheckCircle,
  Star,
  Settings,
  TrendingUp,
  Users,
  Heart,
  Clock,
  Image,
  Zap
} from 'lucide-react';

interface UserGuidePageProps {
  onBack: () => void;
}

export function UserGuidePage({ onBack }: UserGuidePageProps) {
  // CSS for hiding scrollbar - TEMPORARILY DISABLED FOR TESTING
  // const scrollbarHideStyle = `
  //   .scrollbar-hide::-webkit-scrollbar {
  //     display: none;
  //   }
  //   .scrollbar-hide {
  //     -ms-overflow-style: none;
  //     scrollbar-width: none;
  //   }
  // `;
  
  // useEffect(() => {
  //   const style = document.createElement('style');
  //   style.textContent = scrollbarHideStyle;
  //   document.head.appendChild(style);
  //   return () => document.head.removeChild(style);
  // }, []);
  
  const [activeTab, setActiveTab] = useState('getting-started');
  const contentRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // スワイプ機能
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (tabs.length > 0) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id);
      }
      
      if (isRightSwipe && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1].id);
      }
    }
  };

  const tabs = [
    { id: 'getting-started', title: 'はじめに', subtitle: 'カウンセリング・初期設定' },
    { id: 'ai-chat', title: 'ヘルシーくんと会話', subtitle: 'LINE基本操作・AI分析' },
    { id: 'recording', title: '記録方法', subtitle: '食事・運動・体重記録' },
    { id: 'feedback', title: 'フィードバック', subtitle: '1日の振り返り・データ活用' },
    { id: 'web-app', title: 'アプリ活用', subtitle: 'Webアプリ・詳細機能' },
    { id: 'troubleshooting', title: 'よくある質問', subtitle: 'よくある質問・問題解決' }
  ];

  // アクティブタブが変わったらタブメニューをスクロール
  useEffect(() => {
    if (tabContainerRef.current && tabs.length > 0) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      if (currentIndex >= 0) {
        const tabButtons = tabContainerRef.current.children;
        const targetButton = tabButtons[currentIndex] as HTMLElement;
        if (targetButton && typeof targetButton.scrollIntoView === 'function') {
          try {
            targetButton.scrollIntoView({
              behavior: 'smooth',
              inline: 'center'
            });
          } catch (error) {
            // Fallback for older browsers
            targetButton.scrollIntoView();
          }
        }
      }
    }
  }, [activeTab, tabs]);

  const guideContent = {
    'getting-started': (
      <div className="bg-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* ヘッダー */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              ヘルシーくんの使い方
            </h1>
            <p className="text-gray-600">
              LINEで健康管理を始めよう
            </p>
          </div>

          {/* 1. 友だち追加 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                1. 友だち追加
              </h2>
              <p className="text-gray-700 leading-relaxed mb-16">
                LINEで「ヘルシーくん」を友だち追加すると、自動的にウェルカムメッセージが届きます。ここから健康管理がスタートします
              </p>
            </div>
          </div>

          {/* 2. 基本情報を入力 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                2. 基本情報を入力
              </h2>
              <p className="text-gray-700 leading-relaxed mb-16">
                年齢、身長、体重、目標体重、活動量などの基本情報を入力します。この情報をもとに、あなた専用の目安カロリーとPFCバランスが計算されます
              </p>
            </div>
          </div>

          {/* 3. カウンセリング結果が届く */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                3. カウンセリング結果が届く
              </h2>
              <p className="text-gray-700 leading-relaxed mb-16">
                LINEにあなたの目標に向けての1日の目安カロリーとPFCバランス（タンパク質・脂質・炭水化物）が表示されます。これがあなたの健康管理の基準になります
              </p>
            </div>
          </div>

          {/* 4. あなた専用のページへ */}
          <div className="mb-32">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                4. あなた専用のページへ
              </h2>
              <p className="text-gray-700 leading-relaxed mb-16">
                カウンセリング結果をタップすると、あなた専用のページに移動します。ここでは目安カロリーやPFCバランスがグラフで表示され、毎日の食事・運動・体重を記録できます。記録したデータは自動で集計され、目標達成をサポートします
              </p>
            </div>
          </div>

        </div>
      </div>
    ),
    'ai-chat': (
      <div className="bg-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* ヘッダー */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              ヘルシーくんとの会話
            </h1>
            <p className="text-gray-600">
              フィットネスなどに詳しいヘルシーくんがあなたの悩みをサポート
            </p>
          </div>

          {/* AIについて */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                LINEでヘルシーくんと会話できる
              </h2>
              <p className="text-gray-700 leading-relaxed mb-16">
                フィットネスなどに詳しいヘルシーくんにいろいろなことを相談できます
              </p>
            </div>
          </div>

          {/* 相談例 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                こんなことが聞けます
              </h2>
              
              <div className="space-y-3 text-gray-800 mb-16">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>唐揚げのカロリー教えて</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>お腹の脂肪を減らしたいけどどうしたらいい？</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>つい食べ過ぎてしまう</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>痩せる料理教えて！</span>
                </div>
              </div>
            </div>
          </div>

          {/* その他 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                他にもたくさん聞けます
              </h2>
              
              <div className="space-y-3 text-gray-700 mb-16">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>運動のやり方やメニュー</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>食材の栄養素や効果</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>健康的な生活習慣のアドバイス</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>モチベーションの保ち方</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>体調管理のコツ</span>
                </div>
              </div>
            </div>
          </div>

          {/* 使い方 */}
          <div className="mb-32">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                使い方
              </h2>
              <p className="text-gray-700 leading-relaxed mb-16">
                LINEで普通にメッセージを送るだけ
              </p>
            </div>
          </div>

        </div>
      </div>
    ),
    'recording': (
      <div className="bg-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* ヘッダー */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              記録のやり方
            </h1>
            <p className="text-gray-600">
              LINEとアプリで簡単に記録できます
            </p>
          </div>


          {/* 食事記録（カメラ） */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                食事記録（カメラで記録）
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                食事の写真を送るだけで、自動でAIがカロリーを分析してくれます
              </p>
              <div className="space-y-3 text-gray-800 mb-4">
                <div className="flex items-start">
                  <span className="mr-3">1.</span>
                  <span>食事の写真を撮ってLINEで送信する</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">2.</span>
                  <span>AIが自動で食事を分析開始</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">3.</span>
                  <span>朝食・昼食・夕食・間食から食事の種類を選択</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">4.</span>
                  <span>カロリーとPFCが計算されて記録完了</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg mb-16">
                <p className="font-semibold text-gray-800 mb-2">重要</p>
                <p className="text-gray-700 text-sm">
                  写真を送ると自動で記録モードになります。「記録」という言葉は不要です。1枚ずつ送信してください。
                </p>
              </div>
            </div>
          </div>

          {/* 食事記録（テキスト） */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                食事記録（テキストで記録）
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                「記録」という言葉を含めてメッセージを送ると、食事記録モードになります。1食ずつでも、まとめてでもOK
              </p>
              <div className="space-y-3 text-gray-700 mb-4">
                <p className="font-semibold">記録例</p>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「朝にヨーグルト記録したい」</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「昼に唐揚げとご飯100g食べた！記録お願いします」</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「記録：朝にヨーグルト 昼にカツ丼と味噌汁 夜に餃子5個とご飯 おやつにクッキー2枚」</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg mb-16">
                <p className="font-semibold text-gray-800 mb-2">重要</p>
                <p className="text-gray-700 text-sm mb-2">
                  必ず「記録」という言葉を含めてください。含めないと普通の会話として扱われます。
                </p>
                <p className="font-semibold text-gray-800 mb-2">記録のコツ</p>
                <p className="text-gray-700 text-sm">
                  料理の中身も記録したい場合は、例：「お鍋（豚肉 白菜 えのき）記録して」のように記録すると、うまく分析されます
                </p>
              </div>
            </div>
          </div>

          {/* 食事記録（アプリから） */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                食事記録（アプリから）
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                記録したい食事のフレームをタップすると、4つの記録方法が選べます
              </p>
              <div className="space-y-3 text-gray-800 mb-16">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>カメラで記録（LINEと同じ）</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>テキストで記録（LINEと同じ）</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>過去から記録（過去の記録から選ぶ）</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>手動で記録（食事名・カロリー・PFCを自分で入力）</span>
                </div>
              </div>
            </div>
          </div>

          {/* 体重記録 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                体重記録
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                「記録」という言葉を含めて体重を記録できます
              </p>
              <div className="space-y-3 text-gray-700 mb-4">
                <p className="font-semibold">記録例</p>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「体重 78kg 記録」</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「記録：体重78kg」</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「体重78キロ記録したい」</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="font-semibold text-gray-800 mb-2">重要</p>
                <p className="text-gray-700 text-sm">
                  必ず「記録」という言葉と「体重」という言葉、そして数値（kg、キロ）を含めてください
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-16">
                アプリの体重フレームからも記録・編集できます
              </p>
            </div>
          </div>

          {/* 運動記録 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                運動記録
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                「記録」という言葉を含めて自然な言葉で運動を記録できます。有酸素運動・筋トレ・スポーツなど、すべての運動が記録できます
              </p>
              <div className="space-y-3 text-gray-700 mb-4">
                <p className="font-semibold">記録例</p>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「ランニング 3km 20分 記録」</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「ベンチプレス 80kg 10回 90kg 10回 記録して」</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「腹筋100回 3セット 記録お願いします」</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「今日は、ヨガ20分したよ！記録」</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>「野球したー！記録したい」</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="font-semibold text-gray-800 mb-2">重要</p>
                <p className="text-gray-700 text-sm">
                  必ず「記録」という言葉を含めてください。含めないと普通の会話として扱われます
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-16">
                アプリの運動フレームからも記録・編集できます
              </p>
            </div>
          </div>

          {/* 記録の確認・編集 */}
          <div className="mb-32">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                記録の確認・編集
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                記録すると返事が返ってきます。その返事をタップするとアプリに飛んで、詳しく確認・編集できます
              </p>
              <div className="space-y-3 text-gray-800 mb-4">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>食事記録をタップ → カロリー・PFC・画像を編集</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>ホームのカロリーグラフ → 今どのくらい摂取しているか確認</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>目安カロリーと比較できる</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-16">
                LINEのリッチメニューのマイページからも確認できます
              </p>
            </div>
          </div>

        </div>
      </div>
    ),
    'feedback': (
      <div className="bg-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* ヘッダー */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              フィードバック機能
            </h1>
            <p className="text-gray-600">
              その日の記録から、あなたへのアドバイスが届きます
            </p>
          </div>

          {/* フィードバックとは */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                フィードバックとは
              </h2>
              <p className="text-gray-700 leading-relaxed mb-16">
                リッチメニューの「フィードバック」ボタンを押すと、その日に記録された内容を見て、食事面・運動面についての詳細なアドバイスが返ってきます
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg mb-16">
                <p className="font-semibold text-gray-800 mb-2">利用条件</p>
                <p className="text-gray-700 text-sm">
                  フィードバック機能は有料プランの機能です。無料プランの場合はプラン変更が必要になります
                </p>
              </div>
            </div>
          </div>

          {/* 使い方 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                使い方
              </h2>
              <div className="space-y-3 text-gray-800 mb-16">
                <div className="flex items-start">
                  <span className="mr-3">1.</span>
                  <span>リッチメニューの「フィードバック」ボタンを押す</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">2.</span>
                  <span>その日の記録が分析される</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">3.</span>
                  <span>フィードバックが返ってくる</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">4.</span>
                  <span>返ってきたフィードバックをタップするとアプリに飛ぶ</span>
                </div>
              </div>
            </div>
          </div>

          {/* フィードバックの内容 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                フィードバックの内容
              </h2>
              <div className="space-y-3 text-gray-800 mb-16">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>食事評価：良かった点と改善点</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>運動評価：良かった点と継続のコツ</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>具体的な数値目標と健康豆知識</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>親しみやすい口調でのアドバイス</span>
                </div>
              </div>
            </div>
          </div>

          {/* アプリでの確認 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                アプリでの確認
              </h2>
              <p className="text-gray-700 leading-relaxed mb-16">
                返ってきたフィードバックをタップすると、アプリに飛んでフィードバックが確認できます。アプリにもフィードバックが反映されています
              </p>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="mb-32">
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-800 mb-2">注意事項</p>
                <p className="text-gray-700 text-sm mb-2">
                  記録が少ない場合、十分なアドバイスが生成されない場合があります。食事・運動・体重をできるだけ記録した状態で利用することをおすすめします
                </p>
                <p className="text-gray-700 text-sm">
                  フィードバック生成にはAIを使用するため、少し時間がかかる場合があります
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    ),
    'web-app': (
      <div className="bg-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* ヘッダー */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              アプリの使い方
            </h1>
            <p className="text-gray-600">
              アプリからも記録・編集・確認ができます
            </p>
          </div>

          {/* ホームから記録 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                ホームから記録する
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ホームにあるフレームをタップすると記録できます
              </p>
              <div className="space-y-3 text-gray-800 mb-16">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>体重フレーム → 体重を記録</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>食事フレーム（朝食・昼食・夕食・間食）→ 食事を記録</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>運動フレーム → 運動を記録</span>
                </div>
              </div>
            </div>
          </div>

          {/* フレームの開閉 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                フレームの開閉
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ホームには4つのフレームがあります。各フレームの上部をタップすると、開いたり閉じたりできます
              </p>
              <div className="space-y-3 text-gray-800 mb-4">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>カロリーのグラフ → 今日取ったカロリーやPFCが確認できる</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>今日の食事記録 → 記録された食事が表示される</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>今日の運動 → 記録された運動が表示される</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>フィードバック → その日のフィードバックが表示される</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-16">
                カロリーのグラフには、記録されたカロリーやPFCがリアルタイムで反映され、目安カロリーと比較できます
              </p>
            </div>
          </div>

          {/* 記録の編集・追加 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                記録の編集・追加
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                アプリから記録の編集や追加ができます
              </p>
              <div className="space-y-3 text-gray-800 mb-16">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>記録された食事をタップ → カロリー・PFC・画像を編集</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>体重フレームをタップ → 体重の追加・編集</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>運動フレームをタップ → 運動の追加・編集</span>
                </div>
              </div>
            </div>
          </div>

          {/* プロフィール編集 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                プロフィール編集
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                マイページからプロフィールを編集できます
              </p>
              <p className="text-gray-800 mb-16">
                プロフィールを編集すると、自動でカロリーやPFCが再分析されて、ホームのグラフなどに反映されます
              </p>
            </div>
          </div>

          {/* リマインダー設定 */}
          <div className="mb-32">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                リマインダー設定
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                リマインダー設定から、好きな時間に通知を受け取れます
              </p>
              <div className="space-y-3 text-gray-800 mb-4">
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>通知の内容を自由に設定できる</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-3">⚫︎</span>
                  <span>通知の時間を自由に設定できる</span>
                </div>
              </div>
              <p className="text-gray-700 mb-16">
                例：「朝食の時間だよ！」を朝7時に設定
              </p>
            </div>
          </div>

        </div>
      </div>
    ),
    'troubleshooting': (
      <div className="bg-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* ヘッダー */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              よくある質問
            </h1>
            <p className="text-gray-600">
              困ったときはこちらをご確認ください
            </p>
          </div>

          {/* 基本的な使い方 */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                基本的な使い方
              </h2>

              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 記録したいのに普通の会話になります</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. メッセージに「記録」という言葉を含めて送ってください。例：「朝食記録したい」「体重記録」など。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. ヘルシーくんと会話したいのに記録になります</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. メッセージに「記録」という言葉が含まれていませんか？「記録」という言葉を入れずにメッセージを送ってください。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. LINEとアプリのどちらから記録すればいいですか？</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. どちらからでも記録できます。LINEは外出先での手軽な記録に、アプリは詳細な編集や確認に便利です。お好きな方をご利用ください。
                </p>
              </div>
            </div>
          </div>

          {/* 食事記録について */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                食事記録について
              </h2>

              <div className="mb-6">
                <div className="bg-green-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 写真で記録したカロリーが正確ではありません</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. AIによる分析は目安です。より正確に記録したい場合は、アプリから手動で編集してください。カロリーやPFCを自由に変更できます。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-green-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 写真を複数枚送りたいのですが</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. 写真での記録は1回につき1枚です。複数の料理を記録したい場合は、1枚ずつ分けて送るか、テキストでまとめて記録してください。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-green-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 料理の中身まで細かく記録したいです</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. テキスト記録で「お鍋（豚肉 白菜 えのき）」のように、カッコ内に具材を入れると、より正確に分析されます。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-green-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 朝・昼・夜をまとめて記録できますか？</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. できます。「朝にヨーグルト 昼にカツ丼 夜に餃子5個」のように、1つのメッセージにまとめて送ってください。
                </p>
              </div>
            </div>
          </div>

          {/* カロリー・PFCについて */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                カロリー・PFCについて
              </h2>

              <div className="mb-6">
                <div className="bg-purple-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 目安カロリーを変更したいです</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. マイページから「プロフィール編集」を開き、目標設定や体重などを変更してください。自動で再計算されます。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-purple-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. カロリーの計算が合いません</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. 記録された食事の内容を確認してください。AIの分析が不正確な場合は、アプリから手動で修正できます。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-purple-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. PFCバランスとは何ですか？</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. タンパク質（Protein）、脂質（Fat）、炭水化物（Carbohydrate）のバランスです。健康的な体作りには、このバランスが重要です。
                </p>
              </div>
            </div>
          </div>

          {/* 体重・運動記録について */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                体重・運動記録について
              </h2>

              <div className="mb-6">
                <div className="bg-orange-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 体重が記録されません</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. 「記録」と「体重」という言葉と数字を含めて送ってください。例：「体重記録 78kg」「体重 78kg 記録したい」
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-orange-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 運動の記録方法がわかりません</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. 自然な言葉で記録できます。「ランニング 3km」「腹筋100回」「ヨガ20分」など、自由に記録してください。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-orange-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 目標体重を変更したいです</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. マイページの「プロフィール編集」から目標体重を変更できます。
                </p>
              </div>
            </div>
          </div>

          {/* フィードバックについて */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                フィードバックについて
              </h2>

              <div className="mb-6">
                <div className="bg-pink-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. フィードバックが返ってきません</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. その日の記録が少ない場合、フィードバックが生成されないことがあります。食事や運動を記録してから、もう一度試してください。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-pink-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. フィードバックはいつでも見返せますか？</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. はい。アプリのホーム画面にある「フィードバック」フレームから、過去のフィードバックも確認できます。
                </p>
              </div>
            </div>
          </div>

          {/* アプリ・データについて */}
          <div className="mb-20">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                アプリ・データについて
              </h2>

              <div className="mb-6">
                <div className="bg-gray-100 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 過去の記録を編集・削除できますか？</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. できます。アプリのホーム画面から該当の記録をタップして、編集または削除してください。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-gray-100 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. データが消えてしまいました</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. アプリとLINEのデータは同期されています。アプリを再起動するか、LINEから再度アクセスしてみてください。それでも解決しない場合は、サポートにお問い合わせください。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-gray-100 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. リマインダーの通知が来ません</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. スマートフォンの通知設定を確認してください。また、アプリのリマインダー設定が正しく保存されているかご確認ください。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-gray-100 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 退会したいです</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. LINEのブロックまたは友達削除で、サービスの利用を停止できます。データを完全に削除したい場合は、サポートにお問い合わせください。
                </p>
              </div>
            </div>
          </div>

          {/* その他 */}
          <div className="mb-32">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                その他
              </h2>

              <div className="mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 利用料金はかかりますか？</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. 基本機能は無料でご利用いただけます。
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg mb-3">
                  <h3 className="font-bold text-gray-800">Q. 問題が解決しない場合は？</h3>
                </div>
                <p className="text-gray-700 pl-3 mb-16">
                  A. LINEのメニューから「お問い合わせ」を選択するか、公式サイトのサポートページからお問い合わせください。
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* 固定ヘッダー */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
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
          <div className="w-16"></div>
        </div>
        
        {/* スライド可能なタブメニュー */}
        <div className="px-4 pb-2 overflow-hidden">
          <div 
            ref={tabContainerRef}
            className="flex overflow-x-auto space-x-2 scrollbar-hide"
            style={{
              WebkitOverflowScrolling: 'touch',
              width: 'calc(100vw - 2rem)',
              minWidth: '100%',
              scrollBehavior: 'smooth'
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? "default" : "outline"}
                className={`flex-shrink-0 px-6 py-2 text-sm whitespace-nowrap min-w-[160px] transition-all duration-300 ease-in-out ${
                  activeTab === tab.id 
                    ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                {tab.title}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1">
        <div 
          ref={contentRef}
          className="overflow-y-auto p-4"
          style={{ 
            height: 'calc(100vh - 200px)',
            paddingBottom: '120px',
            WebkitOverflowScrolling: 'touch'
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* アクティブタブの説明 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              {tabs.find(tab => tab.id === activeTab)?.title}
            </h2>
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.subtitle}
            </p>
          </div>

          {/* コンテンツ表示 */}
          <div className="prose prose-gray max-w-none">
            {typeof guideContent[activeTab as keyof typeof guideContent] === 'string' ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {guideContent[activeTab as keyof typeof guideContent]}
              </div>
            ) : (
              guideContent[activeTab as keyof typeof guideContent]
            )}
          </div>

        </div>
      </div>
    </div>
  );
}