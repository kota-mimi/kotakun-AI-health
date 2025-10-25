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
  // CSS for hiding scrollbar
  const scrollbarHideStyle = `
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = scrollbarHideStyle;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
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
    { id: 'getting-started', title: '🎯 はじめに', subtitle: 'カウンセリング・初期設定' },
    { id: 'ai-chat', title: '🤖 AIと会話', subtitle: 'LINE基本操作・AI分析' },
    { id: 'recording', title: '📝 記録方法', subtitle: '食事・運動・体重記録' },
    { id: 'feedback', title: '📊 フィードバック', subtitle: '1日の振り返り・データ活用' },
    { id: 'web-app', title: '🌐 アプリ活用', subtitle: 'Webアプリ・詳細機能' },
    { id: 'troubleshooting', title: '❓ トラブル', subtitle: 'よくある質問・問題解決' }
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
    'getting-started': `
## 🎯 はじめに・初期設定

### kotakunへようこそ！
kotakunは、LINEで簡単に記録できる健康管理アプリです。

### 1. LINE友達追加
**📸 [QRコード画像をここに配置]**

1. QRコードをスマホで読み取り
2. 「友だち追加」をタップ
3. kotakunと友達になる

### 2. カウンセリング設定（重要！）
**📸 [カウンセリング画面をここに配置]**

友達追加後、自動でカウンセリングが開始されます。

**入力項目：**
- お名前
- 年齢・性別  
- 身長・体重
- 目標（ダイエット・筋肉増加・健康維持）
- 現在の運動習慣

### 3. 初期設定完了の確認
**📸 [設定完了画面をここに配置]**

✅ 目標カロリーが表示される
✅ PFC値（タンパク質・脂質・炭水化物）が設定される  
✅ リッチメニューが表示される

### はじめての記録
1. **朝の体重測定**を記録
2. **朝食の写真**を撮影・送信
3. **AI分析結果**を確認

これで基本設定は完了です！
    `,
    'ai-chat': `
## 🤖 AIと会話

### リッチメニューの使い方
**📸 [リッチメニュー画像をここに配置]**

- **🍽️ 食事記録**：写真やテキストで記録
- **🏃 運動記録**：運動内容を入力
- **⚖️ 体重記録**：体重・体脂肪率を記録
- **🤖 AIアドバイス**：健康アドバイスを受け取り
- **📊 データ確認**：Webアプリへ移動
- **⚙️ 設定**：各種設定変更

### 食事記録の方法

#### 📸 写真で記録（推奨）
**📸 [食事写真撮影画面をここに配置]**

1. リッチメニューから「🍽️ 食事記録」をタップ
2. カメラで食事を撮影
3. 食事タイプを選択（朝食・昼食・夕食・間食）
4. 送信

**✨ AI分析が自動実行されます**
- カロリー計算
- 栄養素分析（PFC値）
- 食材の識別
- 改善提案

#### ✏️ テキストで記録
**例：** 「朝食：ご飯、味噌汁、焼き魚、サラダ」

1. 食事内容をテキストで入力
2. 食事タイプを選択
3. 送信

### AIアドバイスの活用
**📸 [AIアドバイス画面をここに配置]**

#### 受け取るタイミング
- 食事記録後
- 1日の記録完了後
- 週間データ分析時

#### アドバイス内容
- 栄養バランス評価
- カロリー収支分析
- 運動提案
- 生活習慣改善案
    `,
    'recording': `
## 📝 記録方法

### 運動記録の方法
**📸 [運動記録画面をここに配置]**

#### 入力例
- 「ウォーキング 30分」
- 「筋トレ 腕立て伏せ 20回×3セット」
- 「ランニング 5km 25分」
- 「ストレッチ 15分」

#### 自動処理
- 消費カロリー計算
- 運動強度判定
- 週間目標との比較

### 体重記録の方法
**📸 [体重記録画面をここに配置]**

1. リッチメニューから「⚖️ 体重記録」
2. 体重を入力（例：65.5）
3. 体脂肪率も記録可能（任意）
4. 送信

**自動表示：**
- 前日比
- 目標までの差
- BMI値

### 正確な食事記録のコツ

#### 📸 写真撮影のポイント
**📸 [良い写真例・悪い写真例をここに配置]**

**✅ Good（良い例）**
- 真上から撮影
- 全体が映っている
- 明るい場所で撮影
- 食器や手で量感が分かる

**❌ Bad（改善点）**
- 斜めから撮影
- 一部が見切れている
- 暗い・ぼけている
- 量が分からない

### 記録漏れを防ぐコツ
1. **食事前に撮影**：食べる前に必ず写真
2. **間食も忘れずに**：飴一個でも記録
3. **外食時の工夫**：メニュー名をメモ
4. **飲み物も重要**：ジュース、お酒も記録

### 継続のコツ
- **小さな運動も記録**：階段を使った、歩いた
- **日常動作も運動**：掃除、買い物も記録
- **休息日も大切**：完全休養も記録
    `,
    'feedback': `
## 📊 フィードバック・データ活用

### 1日の振り返り
**📸 [日次フィードバック画面をここに配置]**

毎日の記録完了後、AIが自動で分析：
- 今日のカロリー収支
- 栄養バランス評価
- 運動量の評価
- 明日への改善提案

### 週間データの見方
**📸 [週間データ画面をここに配置]**

毎週末に確認：
- カロリー収支の傾向
- 栄養バランスの偏り
- 運動頻度・強度
- 体重変動

### 改善点の見つけ方
1. **赤字の日**：カロリーオーバーの原因分析
2. **運動不足の日**：忙しい日の対策検討
3. **栄養の偏り**：不足しがちな栄養素の確認

### モチベーション維持
- **小さな目標設定**：週単位での達成感
- **記録継続日数**：何日続いているかチェック
- **AI褒めポイント**：良い記録への反応を楽しむ
- **体調変化を実感**：数値以外の変化も記録

### 習慣化のステップ
**第1週：慣れる**
- 記録操作に慣れる
- 基本パターンを覚える

**第2-3週：定着**
- 記録忘れを減らす
- データの見方を理解

**第4週以降：活用**
- データを基に改善
- 目標達成への調整
    `,
    'web-app': `
## 🌐 Webアプリ活用

### アクセス方法
**📸 [Webアプリアクセス画面をここに配置]**

1. LINEリッチメニューから「📊 データ確認」をタップ
2. ブラウザでWebアプリが開く
3. ダッシュボードが表示される

### ダッシュボードの見方
**📸 [ダッシュボード全体画面をここに配置]**

#### 📊 上部サマリー
- **今日のカロリー**：摂取/消費/収支
- **体重変化**：前日比・目標との差
- **運動時間**：今日の活動量
- **栄養バランス**：PFC比率

#### 📈 中央グラフエリア
- **体重推移グラフ**：過去30日の変化
- **カロリー推移**：週間平均
- **栄養バランス**：過去7日の平均

### 詳細なデータ編集

#### ✏️ 食事記録の編集
**📸 [食事編集画面をここに配置]**

1. 食事記録をクリック
2. 編集画面が開く
3. 修正可能項目：
   - 食材の追加・削除
   - 分量の調整
   - カロリー・栄養素の手動入力
   - 食事時間の変更

### 設定・カスタマイズ
**📸 [設定画面をここに配置]**

- **目標体重の変更**：段階的な目標設定
- **活動レベル調整**：基礎代謝の見直し
- **目標カロリー設定**：手動での微調整
- **PFC比率調整**：個人の好みに合わせて

### データ管理
- **データエクスポート**：CSV形式でダウンロード
- **バックアップ**：クラウド自動保存設定
- **データ削除**：不要記録の一括削除
- **アカウント移行**：機種変更時の準備
    `,
    'troubleshooting': `
## ❓ よくある質問・トラブル対応

### 🚨 記録に関するトラブル

#### Q: 食事の写真を送ったのに反応がない
**📸 [エラー画面例をここに配置]**

**原因と対処法：**
1. **ネットワーク接続**：Wi-Fi・4G接続を確認
2. **画像サイズ**：大きすぎる場合は圧縮してリトライ
3. **LINE app更新**：最新版に更新
4. **再送信**：「もう一度送信してください」と入力

✅ **正常な場合の反応時間：10-30秒以内**

#### Q: AI分析結果が間違っている
**例：**「ご飯」→「パン」と認識された

**対処法：**
1. **修正依頼**：「ご飯でした」「白米500g」など正しい情報を送信
2. **詳細追加**：「白米200g、鮭、サラダ」のように具体的に入力
3. **Webアプリで編集**：詳細な手動修正

#### Q: 運動記録が反映されない
**確認ポイント：**
- 運動名は日本語で入力
- 時間・回数は数字で明記
- 「筋トレ」→「腕立て伏せ 20回」など具体的に

**正しい入力例：**
- ✅「ウォーキング 30分」
- ✅「ランニング 5km」
- ❌「運動した」（曖昧）

### 📊 データ表示のトラブル

#### Q: Webアプリでデータが表示されない
**チェック項目：**
1. **ブラウザ更新**：F5キーまたは再読み込み
2. **キャッシュクリア**：ブラウザのキャッシュ削除
3. **LINEアプリから再アクセス**：リッチメニューから再度開く
4. **異なるブラウザで試行**：Chrome、Safari等

#### Q: リッチメニューが表示されない
**対処法：**
1. **LINEトーク画面確認**：kotakunのトーク画面で下部を確認
2. **LINE再起動**：アプリを完全終了→再起動
3. **友達ブロック確認**：誤ってブロックしていないかチェック
4. **再友達追加**：一度ブロック→ブロック解除

### 🤖 AI・分析機能

#### Q: PFC値って何？
**P（Protein）：タンパク質**
- 筋肉・肌・髪の材料
- 目安：体重×1.2-2.0g

**F（Fat）：脂質**
- エネルギー・ホルモン材料
- 目安：総カロリーの20-30%

**C（Carbohydrate）：炭水化物**
- 主要エネルギー源
- 目安：総カロリーの50-65%

### 📞 サポート連絡先

#### 🆘 緊急時・重要な問題
**お問い合わせフォーム**：
- Webアプリ→設定→お問い合わせ
- 具体的な状況を詳しく記載

**回答時間：**
- 平日：24時間以内
- 土日祝：48時間以内

#### 💬 簡単な質問
**LINE直接メッセージ：**
- 「ヘルプ」「困った」「質問」と送信
- よくある質問への自動回答
    `
  };

  return (
    <div 
      className="h-screen bg-white flex flex-col overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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

      {/* 固定サイズのメインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={contentRef}
          className="h-full overflow-y-auto p-4"
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
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {guideContent[activeTab as keyof typeof guideContent]}
            </div>
          </div>

          {/* お問い合わせボタン */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MessageCircle size={20} className="text-blue-600" />
                <h4 className="font-semibold text-gray-800">困ったときは</h4>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50" 
                onClick={() => console.log('お問い合わせ')}
              >
                <MessageCircle size={16} className="mr-2" />
                お問い合わせフォーム
              </Button>
              <div className="text-xs text-gray-500 px-2">
                <p>• LINE直接メッセージ：「ヘルプ」「困った」と送信</p>
                <p>• 回答時間：平日24時間以内</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}