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
    { id: 'getting-started', title: 'はじめに', subtitle: 'カウンセリング・初期設定' },
    { id: 'ai-chat', title: 'こたくんと会話', subtitle: 'LINE基本操作・AI分析' },
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
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              こたくんの使い方
            </h1>
            <p className="text-gray-600">
              LINEで健康管理を始めよう
            </p>
          </div>

          {/* 1. 友だち追加 */}
          <div className="mb-12">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                1. 友だち追加
              </h2>
              <p className="text-gray-700 leading-relaxed">
                LINEで「こたくん」を友だち追加すると、自動的にウェルカムメッセージが届きます。ここから健康管理がスタートします
              </p>
            </div>
          </div>

          {/* 2. 基本情報を入力 */}
          <div className="mb-12">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                2. 基本情報を入力
              </h2>
              <p className="text-gray-700 leading-relaxed">
                年齢、身長、体重、目標体重、活動量などの基本情報を入力します。この情報をもとに、あなた専用の目安カロリーとPFCバランスが計算されます
              </p>
            </div>
          </div>

          {/* 3. カウンセリング結果が届く */}
          <div className="mb-12">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                3. カウンセリング結果が届く
              </h2>
              <p className="text-gray-700 leading-relaxed">
                LINEにあなたの目標に向けての1日の目安カロリーとPFCバランス（タンパク質・脂質・炭水化物）が表示されます。これがあなたの健康管理の基準になります
              </p>
            </div>
          </div>

          {/* 4. あなた専用のページへ */}
          <div className="mb-12">
            <div className="section">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                4. あなた専用のページへ
              </h2>
              <p className="text-gray-700 leading-relaxed">
                カウンセリング結果をタップすると、あなた専用のページに移動します。ここでは目安カロリーやPFCバランスがグラフで表示され、毎日の食事・運動・体重を記録できます。記録したデータは自動で集計され、目標達成をサポートします
              </p>
            </div>
          </div>

        </div>
      </div>
    ),
    'ai-chat': `
## 🤖 こたくんと会話

### 📱 リッチメニューの使い方
**画面下部に常時表示される6つのボタン**

🍽️ **食事記録**　→　写真やテキストで食事を記録  
🏃 **運動記録**　→　運動内容と時間を入力  
⚖️ **体重記録**　→　体重・体脂肪率を記録  
🤖 **AIアドバイス**　→　健康アドバイスを受け取り  
📊 **データ確認**　→　Webアプリでグラフ確認  
⚙️ **設定変更**　→　目標値や個人情報の変更  

### 🍽️ 食事記録の方法

#### 📸 写真で記録（推奨・最も正確）
**🔥 たった3ステップで完了！**

1. 📸 **撮影**：食事全体が写るように真上から撮影
2. 📤 **送信**：LINEトークに写真を送信
3. ⏳ **待機**：約10-30秒でAI分析結果が返信

**✨ AI分析の内容：**
- 🧮 **正確なカロリー計算**
- 📊 **PFC値分析**（タンパク質・脂質・炭水化物）
- 🥗 **食材の自動識別**
- 💡 **栄養バランス評価**
- 🎯 **改善アドバイス**

#### ✏️ テキストで記録（外食時に便利）
**記録例：**
- 「ランチ：ハンバーガーとポテト」
- 「朝食：ご飯、味噌汁、焼き魚、サラダ」
- 「間食：チョコレート3個」

**🤖 こたくんが理解する表現：**
- 食事時間：朝食、昼食、夕食、間食、おやつ
- 分量：大盛り、少なめ、○個、○枚、○杯
- 調理法：焼き、揚げ、蒸し、生

### 🎯 AIアドバイスの活用

#### 📬 アドバイスが届くタイミング
- **即座**：食事記録直後（カロリー・栄養分析）
- **1日の終わり**：全記録を総合評価
- **週1回**：週間データの傾向分析
- **目標達成時**：褒め・励ましメッセージ

#### 💬 こんなアドバイスが届きます
- 「タンパク質がもう少し欲しいです！卵や魚を追加しましょう」
- 「今日はカロリー収支がバッチリ！この調子です」
- 「野菜不足気味です。サラダを1品追加してみませんか？」
- 「水分補給を忘れずに！あと500ml飲みましょう」

### 💬 日常会話も大歓迎！
**気軽に話しかけてください：**
- 「おはよう」「お疲れ様」
- 「今日の調子はどう？」
- 「ダイエットのコツ教えて」
- 「筋トレメニュー考えて」
- 「疲れた」「体調悪い」

**🤖 こたくんは健康の専門家！何でも相談OK**
    `,
    'recording': `
## 📝 記録方法

### 🏃 運動記録の方法
**💪 どんな運動でもOK！日常の活動もすべて記録**

#### ✍️ 簡単な入力例
- 「ウォーキング 30分」→ 約120kcal消費
- 「腕立て伏せ 20回 3セット」→ 約50kcal消費
- 「ランニング 5km 25分」→ 約350kcal消費
- 「階段昇降 10分」→ 約60kcal消費
- 「掃除機かけ 15分」→ 約40kcal消費

#### 🤖 AI自動処理
- 💥 **消費カロリー自動計算**（あなたの体重基準）
- 📊 **運動強度判定**（軽い・普通・激しい）
- 🎯 **週間目標達成度**
- 📈 **継続日数カウント**

### ⚖️ 体重記録の方法
**📏 数値を送るだけで詳細分析！**

#### 📤 送信方法
1. **数値のみ**：「65.5」「67kg」
2. **体脂肪率も**：「65.5kg 20%」
3. **メモ付き**：「65.2kg 生理前でむくんでる」

#### 📊 自動表示内容
- 📈 **前日比**：+0.2kg ↗️ / -0.5kg ↘️
- 🎯 **目標まで**：あと2.3kg
- 📐 **BMI値**：22.1（標準）
- 📅 **変化グラフ**：過去30日の推移

### 📸 食事写真撮影のコツ

#### ✅ **完璧な写真の撮り方**
- 🔝 **真上から撮影**：料理全体が見える角度
- ☀️ **明るい場所**：自然光または明るい照明下
- 🍽️ **食器込み**：サイズ感が分かるように
- 📏 **手も一緒に**：量感の参考になる
- 🥗 **複数品目**：全部まとめて1枚でOK

#### ❌ **避けたい撮影パターン**
- 📐 斜めから撮影（量が分からない）
- 🌃 暗い場所（色が分からない）
- ✂️ 一部が切れている
- 🔍 近すぎる・遠すぎる

### 🔥 記録を習慣化するコツ

#### 📅 毎日の記録ルーチン
1. **朝起きたら**：体重測定→「おはよう」とメッセージ
2. **食事前**：写真撮影→そのまま食事
3. **運動後**：「○○した」と報告
4. **寝る前**：「今日お疲れ様」で1日終了

#### 🎯 継続のための工夫
- 🍬 **飴1個でも記録**：小さなことも大切
- 🚶 **歩いただけでも記録**：「歩いた」だけでもOK
- 🛌 **休息日も記録**：「今日は休養日」
- 💬 **体調も記録**：「調子いい」「疲れてる」

**🏆 記録は完璧じゃなくてOK！継続が一番大切です**
    `,
    'feedback': `
## 📊 フィードバック・データ活用

### 📈 1日の振り返り機能
**🤖 毎日夜9時頃、AIが自動で分析レポート送信**

#### 📝 日次レポート内容
- 🧮 **今日のカロリー収支**：摂取1800kcal / 消費2000kcal = -200kcal
- 🥗 **栄養バランス評価**：タンパク質〇 / 炭水化物△ / 脂質〇
- 💪 **運動量評価**：目標120分 → 今日90分（あと30分！）
- 💡 **明日への改善提案**：「朝食にプロテインを追加しましょう」

#### 🎯 こんな時に特別メッセージ
- 🏆 **目標達成時**：「完璧な1日でした！」
- 📈 **記録更新時**：「過去最高の記録です！」
- 🤗 **励ましが必要な時**：「明日は新しい日！一緒に頑張りましょう」

### 📊 週間データ活用法
**📅 毎週日曜日に1週間の総まとめ**

#### 🔍 週間分析ポイント
- 📉 **体重変化トレンド**：順調に-0.5kg減少中
- 🍽️ **カロリー収支傾向**：平日良好、週末オーバー気味
- 🏃 **運動習慣パターン**：月水金は◎、土日は△
- 🥦 **栄養バランス**：野菜不足が3日間、改善必要

#### 💪 成功パターンの発見
- **調子良い日の共通点**：朝食をしっかり食べた日
- **失敗パターン**：夜遅い食事の翌日は体重増加
- **運動効果**：筋トレ後は基礎代謝UP

### 🎯 改善ポイントの見つけ方

#### 🔴 要注意サイン
1. **カロリーオーバー連続**：3日以上赤字→食事量見直し
2. **運動ゼロ連続**：3日以上→軽いウォーキングから再開
3. **体重増加傾向**：1週間で+1kg→食事内容チェック
4. **栄養偏り**：タンパク質不足が続く→意識的に摂取

#### ✅ 改善アクション例
- 🥗 **野菜不足**：コンビニサラダを1品追加
- 💪 **運動不足**：エレベーターを階段に変更
- 🍖 **タンパク質不足**：おやつをプロテインバーに変更
- 💧 **水分不足**：500mlペットボトルを持ち歩く

### 🏆 モチベーション維持システム

#### 🎖️ 達成バッジ機能
- 📅 **継続バッジ**：7日、30日、100日連続記録
- 🎯 **目標達成バッジ**：週間カロリー目標クリア
- 💪 **運動バッジ**：週3回運動達成
- 📈 **体重管理バッジ**：月間目標体重達成

#### 🚀 習慣化のステップガイド

**🌱 第1週：基礎固め**
- 記録方法をマスター
- こたくんとの会話に慣れる
- 1日3回の記録を習慣化

**🌿 第2-3週：安定期**
- 記録忘れを週1回以下に
- データの見方を理解
- 改善ポイントを1つ実行

**🌳 第4週以降：成長期**
- 自分の傾向を把握
- 効果的な改善策を発見
- 長期目標に向けて調整

**💎 3ヶ月後：習慣完成**
- 無意識に健康的な選択
- 体重管理が自然にできる
- 健康習慣が人生の一部に
    `,
    'web-app': `
## 💻 Webアプリ活用

### 🚀 アクセス方法
**📊 データの詳細確認や詳細設定はWebアプリで！**

#### 🔗 開き方（3つの方法）
1. **LINEから**：リッチメニュー「📊 データ確認」をタップ
2. **ブックマーク**：ブラウザでブックマーク登録
3. **直接アクセス**：kotakun-ai.com（例）

#### 📱 対応環境
- **スマホ**：iPhone Safari、Android Chrome
- **PC**：Chrome、Edge、Firefox
- **タブレット**：iPad Safari、Android Chrome

### 📊 ダッシュボード完全ガイド

#### 🔝 上部サマリーカード
- 🧮 **今日のカロリー**：摂取1,650 / 消費1,850 / 収支-200kcal
- ⚖️ **今日の体重**：65.2kg（昨日比-0.3kg）🎉
- 🏃 **今日の運動**：45分（目標60分まであと15分）
- 🥗 **栄養バランス**：P:25% F:30% C:45%（理想的！）

#### 📈 メイングラフエリア
- 📉 **体重推移グラフ**：過去30日、3ヶ月、1年
- 📊 **カロリー推移**：日別、週平均、月平均
- 🌈 **栄養バランス円グラフ**：PFC比率の変化
- 💪 **運動グラフ**：種類別消費カロリー

### ✏️ 詳細データ編集機能

#### 🍽️ 食事記録の詳細編集
1. **記録選択**：日付をクリック→食事を選択
2. **AI分析確認**：自動認識結果を確認
3. **手動修正**：
   - 🥗 食材の追加・削除・変更
   - 📏 分量の微調整（g単位）
   - 🧮 カロリー・栄養素の手動入力
   - ⏰ 食事時間の変更
   - 📝 メモ追加（「外食」「手作り」など）

#### 🏃 運動記録の詳細編集
- ⏱️ **正確な時間設定**：分単位で調整
- 💪 **強度調整**：軽い・普通・激しい
- 📍 **場所記録**：ジム、公園、自宅など
- 👥 **運動タイプ**：一人・グループ・レッスン

### ⚙️ 高度な設定・カスタマイズ

#### 🎯 目標設定カスタマイズ
- **段階的目標**：3ヶ月で-5kg → 月次目標に分割
- **活動レベル微調整**：生活スタイルに合わせて
- **目標カロリー手動設定**：専門家の指導がある場合
- **PFC比率個別設定**：アスリート向け高タンパク質など

#### 📊 分析期間設定
- **短期分析**：3日、1週間の詳細
- **中期分析**：1ヶ月、3ヶ月のトレンド
- **長期分析**：半年、1年の変化

### 💾 データ管理・バックアップ

#### 📤 エクスポート機能
- **CSV形式**：Excel等で詳細分析
- **PDF形式**：医師への相談資料
- **画像形式**：SNSシェア用グラフ

#### 🔒 セキュリティ・プライバシー
- **クラウド自動保存**：データ消失防止
- **暗号化保存**：個人情報保護
- **データ削除権**：完全削除も可能
- **機種変更対応**：アカウント引き継ぎ

#### 👥 共有機能（オプション）
- **家族共有**：お互いの健康状況を見守り
- **トレーナー共有**：専門家との連携
- **医師共有**：定期健診時の資料として

**💡 WebアプリはLINEの記録を補完する詳細分析ツール！**
    `,
    'troubleshooting': `
## ❓ よくある質問・トラブル対応

### 🚨 記録機能のトラブルシューティング

#### Q: 📸 食事写真を送ったのに反応がない！
**⏰ 正常反応時間：10-30秒以内**

**🔧 対処法（順番に試してください）：**
1. **📶 ネット接続確認**：Wi-Fi・4G電波状況をチェック
2. **📱 LINE再起動**：アプリを完全終了→再起動
3. **🖼️ 画像サイズ確認**：5MB以下に圧縮してリトライ
4. **💬 再送依頼**：「写真をもう一度分析して」と送信
5. **📋 テキスト記録**：とりあえず「朝食：○○」で記録

**🚩 1分以上反応がない場合：サーバー混雑中、時間をおいて再試行**

#### Q: 🤖 AI分析結果が全然違う！
**例：ラーメン → サラダと認識された**

**✅ 即座に修正する方法：**
1. **訂正メッセージ**：「ラーメンでした」「豚骨ラーメン大盛り」
2. **詳細追加**：「ラーメン、チャーシュー、煮卵、のり」
3. **Webアプリ編集**：完全手動修正が可能
4. **学習効果**：修正すればAIが学習して次回改善

**💡 分析精度向上のコツ：**
- 📸 料理全体が映るように撮影
- ☀️ 明るい場所で撮影
- 🍽️ 食器も一緒に写す（サイズ感のため）

#### Q: 🏃 運動記録が認識されない
**❌ 認識されない例：「運動した」「頑張った」**
**✅ 認識される例：「ウォーキング 30分」「腕立て伏せ 20回」**

**📝 正しい入力パターン：**
- **有酸素運動**：「ランニング 5km 30分」「階段昇降 15分」
- **筋トレ**：「腕立て伏せ 20回 3セット」「スクワット 30回」
- **日常活動**：「掃除機 20分」「買い物 1時間」

### 📊 データ・アプリのトラブル

#### Q: 💻 Webアプリでデータが見えない
**🔧 確実な解決手順：**
1. **🔄 ページ更新**：F5またはブラウザの更新ボタン
2. **🗑️ キャッシュクリア**：設定→閲覧データ削除
3. **📱 LINEから再アクセス**：リッチメニュー→データ確認
4. **🌐 ブラウザ変更**：Chrome、Safari、Edgeで試行
5. **⏰ 時間を置く**：サーバー同期に5-10分かかる場合あり

#### Q: 📱 リッチメニューが消えた！
**👀 確認ポイント：**
1. **画面下部確認**：kotakunトーク画面の一番下
2. **LINE更新**：アプリストアでLINE最新版に更新
3. **友達状態確認**：誤ってブロックしていないか
4. **トーク画面リセット**：一度他のトークを開いて戻る

**🔧 リセット方法：**
1. kotakunをブロック→即座にブロック解除
2. 「設定」「スタート」「はじめる」などのメッセージ送信

### 💡 機能・用語の説明

#### Q: 🔤 PFC値って何のこと？
**🍖 P（Protein/タンパク質）**
- 💪 筋肉、肌、髪の材料
- 🎯 目安：体重(kg) × 1.2-2.0g/日
- 🥩 多い食品：肉、魚、卵、豆腐

**🥑 F（Fat/脂質）**
- ⚡ 効率的なエネルギー源
- 🎯 目安：総カロリーの20-30%
- 🥜 多い食品：油、ナッツ、アボカド

**🍚 C（Carbohydrate/炭水化物）**
- 🧠 脳の主要エネルギー源
- 🎯 目安：総カロリーの50-65%
- 🍞 多い食品：米、パン、麺類

#### Q: 📈 基礎代謝って何？
**🔥 何もしなくても消費されるカロリー**
- 😴 寝ているだけでも燃焼
- 💓 心臓、呼吸、体温維持に必要
- 📊 年齢・性別・体重・筋肉量で決まる
- 🎯 ダイエットの基準値になる

### 🆘 サポート・お問い合わせ

#### 📧 緊急時・重要な問題
**🌐 お問い合わせフォーム**
- Webアプリ → 設定 → お問い合わせ
- 📝 症状、端末、状況を詳しく記載

**⏰ 回答時間**
- 🗓️ 平日：24時間以内
- 🗓️ 土日祝：48時間以内
- 🚨 緊急時：数時間以内（データ消失等）

#### 💬 ちょっとした質問
**📱 LINE直接メッセージ**
- 「ヘルプ」「困った」「質問」と送信
- 🤖 自動回答システムで即座に解決
- 📚 よくある質問の90%をカバー

#### 🎓 使い方がわからない時
1. **📖 このガイド**：まずは該当セクションを確認
2. **💬 こたくんに聞く**：「使い方教えて」と送信
3. **🎥 動画ガイド**：公式YouTubeチャンネル
4. **👥 コミュニティ**：ユーザー同士の情報交換

**🤝 私たちは全力でサポートします！遠慮なくご連絡ください**
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
            {typeof guideContent[activeTab as keyof typeof guideContent] === 'string' ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {guideContent[activeTab as keyof typeof guideContent]}
              </div>
            ) : (
              guideContent[activeTab as keyof typeof guideContent]
            )}
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
                onClick={() => {
                  // メール送信またはLINEで問い合わせ
                  const subject = 'kotakun使い方に関するお問い合わせ';
                  const body = 'お問い合わせ内容をご記入ください。\n\n【使用環境】\n- 端末：\n- OS：\n- 問題が発生した機能：\n\n【問題の詳細】\n';
                  const mailtoLink = `mailto:support@kotakun-ai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  window.open(mailtoLink, '_blank');
                }}
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