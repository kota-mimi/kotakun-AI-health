import { useState } from 'react';
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
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  
  const guideCategories = [
    {
      id: 'getting-started',
      title: '🚀 はじめに・初回設定',
      description: '30秒で分かるサービス概要と初期設定',
      icon: Play,
      color: '#4682B4',
      priority: '必須',
      content: `
## kotakunへようこそ！

### サービス概要
kotakunは、LINEで簡単に記録できる健康管理アプリです。
- **LINE**：日常の記録（写真撮影で食事記録、運動記録）
- **Webアプリ**：詳細な分析・データ管理

### 初回設定手順

#### 1. LINE友達追加
**📸 [QRコード画像をここに配置]**

1. 上記QRコードをスマホで読み取り
2. 「友だち追加」をタップ
3. kotakunと友達になる

#### 2. カウンセリング設定（重要！）
友達追加後、自動でカウンセリングが開始されます。

**入力項目：**
- お名前
- 年齢・性別
- 身長・体重
- 目標（ダイエット・筋肉増加・健康維持）
- 現在の運動習慣

**💡 ポイント：** 正確な情報を入力することで、AI分析の精度が向上します

#### 3. 初期設定完了の確認
**📸 [カウンセリング完了画面をここに配置]**

✅ 目標カロリーが表示される
✅ PFC値（タンパク質・脂質・炭水化物）が設定される
✅ リッチメニューが表示される

### はじめての記録
1. **朝の体重測定**を記録
2. **朝食の写真**を撮影・送信
3. **AI分析結果**を確認

これで基本設定は完了です！
      `
    },
    {
      id: 'line-basic',
      title: '📱 LINE基本操作',
      description: 'まず覚える！LINEでの記録方法',
      icon: MessageCircle,
      color: '#00C851',
      priority: 'まず覚える',
      content: `
## LINEでの基本操作

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

### 💡 LINE活用のコツ
- **朝一番**に体重記録
- **食事直後**に写真撮影
- **運動後すぐ**に記録
- **寝る前**にAIアドバイス確認
      `
    },
    {
      id: 'recording-tips',
      title: '💪 記録のコツ・活用法',
      description: '上達編：効果的な記録と継続のコツ',
      icon: Target,
      color: '#FF6B35',
      priority: '上達編',
      content: `
## 記録のコツ・活用法

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

#### 🍽️ 記録漏れを防ぐコツ
1. **食事前に撮影**：食べる前に必ず写真
2. **間食も忘れずに**：飴一個でも記録
3. **外食時の工夫**：メニュー名をメモ
4. **飲み物も重要**：ジュース、お酒も記録

### 効果的な運動記録

#### 🏃 記録すべき項目
**有酸素運動**
- 運動名（ウォーキング、ランニングなど）
- 時間または距離
- 強度（軽い、普通、きつい）

**筋力トレーニング**
- 種目名（腕立て伏せ、スクワットなど）
- セット数・回数
- 使用重量（ダンベルなど）

**その他**
- ストレッチ：時間
- スポーツ：種目・時間

#### 💡 継続のコツ
- **小さな運動も記録**：階段を使った、歩いた
- **日常動作も運動**：掃除、買い物も記録
- **休息日も大切**：完全休養も記録

### データ活用法

#### 📊 週間振り返り
**📸 [週間データ画面をここに配置]**

毎週末に確認：
- カロリー収支の傾向
- 栄養バランスの偏り
- 運動頻度・強度
- 体重変動

#### 🎯 改善点の見つけ方
1. **赤字の日**：カロリーオーバーの原因分析
2. **運動不足の日**：忙しい日の対策検討
3. **栄養の偏り**：不足しがちな栄養素の確認

### 継続するための習慣作り

#### ⏰ 記録タイミングの固定
- **朝6:30**：起床後に体重記録
- **食事直後**：写真撮影・送信
- **運動後**：すぐに記録
- **夜21:00**：1日の振り返り

#### 🎁 モチベーション維持
- **小さな目標設定**：週単位での達成感
- **記録継続日数**：何日続いているかチェック
- **AI褒めポイント**：良い記録への反応を楽しむ
- **体調変化を実感**：数値以外の変化も記録

#### 🔄 習慣化のステップ
**第1週：慣れる**
- 記録操作に慣れる
- 基本パターンを覚える

**第2-3週：定着**
- 記録忘れを減らす
- データの見方を理解

**第4週以降：活用**
- データを基に改善
- 目標達成への調整

### よくある記録ミス・対処法

#### 🚫 記録忘れ対策
- **アラーム設定**：記録時間にスマホアラーム
- **メモ活用**：外出時は一時的にメモ
- **習慣セット**：既存習慣（歯磨きなど）とセット

#### 🔧 データ修正方法
- LINEで修正依頼
- Webアプリで詳細編集
- 翌日に前日分の補足記録
      `
    },
    {
      id: 'web-app',
      title: '🌐 Webアプリ活用',
      description: '詳細管理：ダッシュボード・分析機能',
      icon: BarChart3,
      color: '#8B5CF6',
      priority: '詳細管理',
      content: `
## Webアプリ活用ガイド

### アクセス方法
1. LINEリッチメニューから「📊 データ確認」をタップ
2. ブラウザでWebアプリが開く
3. ダッシュボードが表示される

**📸 [ダッシュボード全体画面をここに配置]**

### ダッシュボードの見方

#### 📊 上部サマリー
**📸 [サマリーカード群をここに配置]**

- **今日のカロリー**：摂取/消費/収支
- **体重変化**：前日比・目標との差
- **運動時間**：今日の活動量
- **栄養バランス**：PFC比率

#### 📈 中央グラフエリア
**📸 [グラフエリアをここに配置]**

- **体重推移グラフ**：過去30日の変化
- **カロリー推移**：週間平均
- **栄養バランス**：過去7日の平均

#### 📝 下部記録一覧
**📸 [記録一覧をここに配置]**

- **今日の食事記録**：詳細表示・編集可能
- **運動記録**：種目別・時間別表示
- **体重記録**：測定時刻・BMI表示

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

#### 🏃 運動記録の編集
**📸 [運動編集画面をここに配置]**

1. 運動記録をクリック
2. 詳細編集：
   - 運動時間の調整
   - 強度の変更
   - セット数・回数の修正
   - 消費カロリーの調整

### グラフ・分析機能

#### 📈 体重推移分析
**📸 [体重グラフ詳細をここに配置]**

- **期間切り替え**：1週間/1ヶ月/3ヶ月/1年
- **トレンドライン**：変化傾向の可視化
- **目標ライン**：目標体重との比較
- **BMI推移**：健康指標の変化

#### 🥗 栄養分析
**📸 [栄養分析画面をここに配置]**

- **PFC比率**：理想値との比較
- **ビタミン・ミネラル**：過不足の確認
- **食物繊維**：摂取量の推移
- **塩分・糖分**：注意すべき栄養素

#### 🏃 運動分析
**📸 [運動分析画面をここに配置]**

- **消費カロリー推移**：日別・週別
- **運動時間統計**：有酸素・筋トレ別
- **運動頻度**：継続日数・休息日
- **目標達成率**：週間目標との比較

### 設定・カスタマイズ

#### ⚙️ 基本設定
**📸 [設定画面をここに配置]**

- **目標体重の変更**：段階的な目標設定
- **活動レベル調整**：基礎代謝の見直し
- **目標カロリー設定**：手動での微調整
- **PFC比率調整**：個人の好みに合わせて

#### 🔔 通知設定
- **記録リマインダー**：食事・運動・体重
- **週間レポート**：データまとめ配信
- **目標達成通知**：マイルストーン到達
- **異常値アラート**：急激な変化の警告

#### 📤 データ管理
**📸 [データ管理画面をここに配置]**

- **データエクスポート**：CSV形式でダウンロード
- **バックアップ**：クラウド自動保存設定
- **データ削除**：不要記録の一括削除
- **アカウント移行**：機種変更時の準備

### プロフィール管理

#### 👤 基本情報更新
**📸 [プロフィール編集をここに配置]**

- **身体情報**：身長・年齢の更新
- **活動レベル**：仕事・運動習慣の変更
- **アレルギー情報**：食材制限の追加
- **病歴・服薬**：健康状態の更新

#### 🎯 目標の見直し
- **短期目標**：1-3ヶ月の具体的目標
- **長期目標**：半年-1年の理想像
- **目標達成期限**：現実的なスケジュール
- **中間チェックポイント**：進捗確認日の設定

### 💡 Webアプリ活用のコツ

#### 📅 定期確認スケジュール
- **毎朝**：昨日のデータ確認
- **週末**：週間振り返り・分析
- **月末**：月次レポート確認
- **目標見直し**：3ヶ月毎の設定更新

#### 🎯 効果的な使い方
- **データ連携確認**：LINE記録の反映チェック
- **詳細分析活用**：数値だけでなく傾向を重視
- **設定最適化**：実際の生活に合わせて調整
- **長期視点**：短期の変動に一喜一憂しない
      `
    },
    {
      id: 'faq-troubleshooting',
      title: '❓ よくある質問・トラブル対応',
      description: '困った時の解決方法',
      icon: HelpCircle,
      color: '#DC2626',
      priority: 'サポート',
      content: `
## よくある質問・トラブル対応

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
**📸 [運動記録画面をここに配置]**

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
**📸 [データ読み込みエラー画面をここに配置]**

**チェック項目：**
1. **ブラウザ更新**：F5キーまたは再読み込み
2. **キャッシュクリア**：ブラウザのキャッシュ削除
3. **LINEアプリから再アクセス**：リッチメニューから再度開く
4. **異なるブラウザで試行**：Chrome、Safari等

#### Q: 昨日の記録が今日に表示される
**原因：**時刻設定の問題

**確認方法：**
1. **スマホの時刻**：自動設定ONを確認
2. **タイムゾーン**：日本時刻（JST）設定
3. **記録時刻**：実際の食事・運動時刻で記録

### 🔧 機能操作のトラブル

#### Q: リッチメニューが表示されない
**📸 [リッチメニュー非表示状態をここに配置]**

**対処法：**
1. **LINEトーク画面確認**：kotakunのトーク画面で下部を確認
2. **LINE再起動**：アプリを完全終了→再起動
3. **友達ブロック確認**：誤ってブロックしていないかチェック
4. **再友達追加**：一度ブロック→ブロック解除

#### Q: 目標設定を変更したい
**📸 [設定変更画面をここに配置]**

**変更方法：**
1. **Webアプリ**：設定→プロフィール編集
2. **LINE**：「設定変更」「目標変更」と入力
3. **再カウンセリング**：「カウンセリングやり直し」と入力

### 📱 アプリ・システムのトラブル

#### Q: LINEアプリが重い・遅い
**対処法：**
1. **メモリ解放**：他のアプリを終了
2. **LINE再起動**：完全終了→再起動
3. **スマホ再起動**：端末の再起動
4. **ストレージ確認**：空き容量の確保

#### Q: 通知が来ない
**📸 [通知設定画面をここに配置]**

**確認項目：**
1. **LINE通知設定**：設定→通知→kotakun ON
2. **スマホ通知設定**：設定→通知→LINE ON  
3. **おやすみモード**：時間指定の確認
4. **バッテリー最適化**：LINE除外設定

### 🔐 アカウント・セキュリティ

#### Q: 機種変更時のデータ引き継ぎ
**事前準備：**
1. **Webアプリ**：データエクスポートでバックアップ
2. **LINEアカウント**：メールアドレス・パスワード設定
3. **設定メモ**：目標体重・基本情報をメモ

**新端末での設定：**
1. LINE引き継ぎ完了
2. kotakunを友達で確認
3. 「データ確認」でWebアプリアクセス
4. 必要に応じて再カウンセリング

#### Q: データを削除したい
**部分削除：**
- Webアプリ→データ管理→選択削除

**全削除：**
- 「データ全削除」とLINEで送信
- 確認メッセージに従って実行

### 🤖 AI・分析機能

#### Q: AIアドバイスの内容を理解したい
**📸 [AIアドバイス例をここに配置]**

**アドバイスの読み方：**
- **栄養評価**：A-D評価の意味
- **改善提案**：具体的なアクション
- **注意点**：健康リスクの警告
- **励ましメッセージ**：継続モチベーション

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

**コミュニティ：**
- ユーザー同士の情報交換
- 成功事例・コツの共有
      `
    },
    {
      id: 'advanced-tips',
      title: '🎯 応用・継続のコツ',
      description: '効果的な目標達成と長期継続',
      icon: TrendingUp,
      color: '#059669',
      priority: '上級者',
      content: `
## 応用・継続のコツ

### 🎯 効果的な目標達成戦略

#### 📊 SMART目標設定法
**📸 [目標設定画面をここに配置]**

**S (Specific) - 具体的**
- ❌「痩せたい」
- ✅「3ヶ月で体重を65kg→60kgに」

**M (Measurable) - 測定可能**
- ❌「運動を頑張る」  
- ✅「週3回、30分のウォーキング」

**A (Achievable) - 達成可能**
- 現在の生活リズムで実現可能な目標
- 段階的なステップアップ

**R (Relevant) - 関連性**
- 自分の価値観・優先順位と一致
- ライフスタイルに適合

**T (Time-bound) - 期限**
- 明確な達成期限の設定
- 中間チェックポイント

#### 🔄 段階的目標設定
**Phase 1（1ヶ月目）：習慣化**
- 毎日の記録を継続
- 基本的な栄養バランス理解
- 軽い運動の習慣づけ

**Phase 2（2-3ヶ月目）：最適化**
- データ分析に基づく改善
- 運動強度・頻度の調整
- 食事内容の質向上

**Phase 3（4-6ヶ月目）：維持・発展**
- 目標体重の維持
- 新しいチャレンジ追加
- ライフスタイルの定着

### 📈 データ活用で健康改善

#### 🔍 パターン分析
**📸 [データ分析画面をここに配置]**

**体重変動のパターン発見**
- 曜日別の傾向（週末の増加等）
- 生理周期との関連（女性）
- ストレス・睡眠との相関
- 季節による変化

**食事パターンの分析**
- 高カロリー食の頻度・タイミング
- 栄養不足の傾向
- 間食の習慣
- 外食の影響度

**運動効果の測定**
- 消費カロリーと体重変化の関係
- 運動タイプ別の効果比較
- 継続期間と効果の相関

#### 🎯 改善サイクル (PDCA)
**Plan（計画）**
- データに基づく仮説立て
- 具体的な改善アクション設定
- 期間と目標値の明確化

**Do（実行）**
- 計画通りの実践
- 詳細な記録継続
- 環境整備・準備

**Check（評価）**
- 定期的な進捗確認
- データでの効果測定
- 予期しない変化の分析

**Action（改善）**
- 成功要因の強化
- 課題点の修正
- 次サイクルへの反映

### 🏃 長期継続のモチベーション維持

#### 🎁 ご褒美システム
**マイルストーン設定**
- 体重-1kg達成→新しいウェア購入
- 1ヶ月継続→好きな食事を楽しむ
- 目標達成→旅行・エステ等

**日々のプチご褒美**
- 記録達成→好きな音楽・動画
- 運動完了→特別なお茶・コーヒー
- データ改善→友人・家族に報告

#### 👥 ソーシャルサポート活用
**📸 [コミュニティ機能画面をここに配置]**

**家族・友人との共有**
- 目標・進捗の共有
- 一緒に運動・食事
- 応援・励ましの受け取り

**オンラインコミュニティ**
- 同じ目標を持つ仲間との交流
- 成功体験・コツの共有
- 困難な時期の相談

#### 🧠 マインドセット
**成長思考の育成**
- 失敗を学習機会として捉える
- 完璧主義より継続重視
- 他人との比較より自分の進歩重視

**セルフコンパッション**
- 自分に優しく接する
- 挫折への理解・許し
- 再スタートへの勇気

### 🔄 習慣化の科学的アプローチ

#### ⚡ 習慣ループの活用
**📸 [習慣ループ図をここに配置]**

**きっかけ（Cue）**
- 時間：毎朝6:30の体重測定
- 場所：キッチンでの食事記録
- 感情：運動後の達成感記録

**ルーチン（Routine）**
- 具体的な行動の標準化
- 必要最小限の手順
- 環境の整備

**報酬（Reward）**
- 即座の満足感
- 長期的な利益実感
- 自己肯定感の向上

#### 🔗 習慣スタッキング
**既存習慣への関連付け**
- 歯磨き後→体重測定
- 食事前→写真撮影
- 入浴前→運動記録

### 🌟 上級者向けテクニック

#### 📊 高度なデータ活用
**相関分析**
- 睡眠時間と体重変化
- ストレスレベルと食事量
- 天候と運動モチベーション

**予測モデリング**
- 現在のペースでの目標達成時期
- 季節要因を考慮した計画調整
- リバウンドリスクの予測

#### 🎮 ゲーミフィケーション
**ポイント制度**
- 記録継続日数でポイント獲得
- 目標達成でボーナスポイント
- ポイントでバーチャル報酬獲得

**チャレンジ機能**
- 月間チャレンジ参加
- 友人との競争
- 季節イベント参加

#### 🔬 バイオハッキング
**詳細な体調管理**
- 心拍数変動の記録
- 睡眠質の詳細分析  
- 血糖値変動の把握

**最適化実験**
- 食事タイミングの実験
- 運動タイプ・強度の比較
- サプリメント効果の検証

### 💡 継続成功者の共通点

#### 🎯 明確な目的意識
- 健康への強い動機
- 具体的な理想像
- 家族・将来への責任感

#### 📅 システマティックなアプローチ
- 定期的な見直し・調整
- データに基づく意思決定
- 柔軟性と継続性のバランス

#### 🌱 成長マインドセット
- 学習・改善への意欲
- 失敗からの回復力
- 長期視点での取り組み

この上級ガイドを活用して、健康管理を人生の重要なスキルとして身につけ、持続可能な健康的ライフスタイルを実現してください。
      `
    }
  ];

  const renderGuideCategory = (category: any) => (
    <Card key={category.id} className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-white/40 bg-white/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{backgroundColor: `${category.color}15`}}
            >
              <category.icon size={20} style={{color: category.color}} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">{category.title}</h3>
              <p className="text-xs text-slate-500">{category.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs" style={{borderColor: category.color, color: category.color}}>
            {category.priority}
          </Badge>
        </div>
      </div>
      
      <Button
        variant="ghost"
        className="w-full justify-start p-4 h-auto hover:bg-white/60 rounded-none"
        onClick={() => setSelectedGuide(category.id)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <BookOpen size={16} className="text-slate-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800 text-sm">詳細ガイドを読む</p>
              <p className="text-xs text-slate-500">操作方法・コツを詳しく解説</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </div>
      </Button>
    </Card>
  );

  const renderGuideDetail = (guideId: string) => {
    const guide = guideCategories.find(g => g.id === guideId);
    if (!guide) return null;

    return (
      <div className="min-h-screen bg-white overflow-y-auto">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedGuide(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
              <span>戻る</span>
            </Button>
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{backgroundColor: `${guide.color}15`}}
              >
                <guide.icon size={16} style={{color: guide.color}} />
              </div>
              <h1 className="text-lg font-semibold text-gray-800">{guide.title}</h1>
            </div>
            <div className="w-16"></div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-4 pb-20">
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {guide.content}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (selectedGuide) {
    return renderGuideDetail(selectedGuide);
  }

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

        {/* その他のヘルプ */}
        <Card className="backdrop-blur-xl bg-slate-50/80 shadow-lg border border-slate-200/50 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MessageCircle size={16} className="text-slate-600" />
              <h4 className="font-semibold text-slate-800">サポート・お問い合わせ</h4>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => console.log('お問い合わせ')}>
                <MessageCircle size={16} className="mr-2" />
                お問い合わせフォーム
              </Button>
              <div className="text-xs text-slate-500 px-2">
                <p>• LINE直接メッセージ：「ヘルプ」「困った」と送信</p>
                <p>• 回答時間：平日24時間以内</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}