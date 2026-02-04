# 決済プラン表示問題の修正指示書

## 🎯 目的
課金ユーザーのプラン表示が正しく動作するかテスト・修正する

## 🔍 発見された問題
1. **実際の課金ユーザー**: `U495bd12b195b7be12845147ebcafb316` のプラン表示が正常か未確認
2. **解約後のユーザー**: 期限内でも無料プラン表示になる（`cancelled` ステータス処理なし）  
3. **永久プランユーザー**: `lifetime` ステータスでも無料プラン表示になる

## 📋 やるべきこと

### 1. テスト環境構築
```bash
# プロジェクト複製（既に完了していること前提）
# cd kotakun-good-test
```

#### A. LINE Bot テストアカウント作成
1. **LINE Developers Console** にアクセス
2. **新しいプロバイダー** または **新しいチャンネル** を作成
3. **Messaging API** チャンネル作成
4. **必要な情報を取得**:
   - Channel Access Token
   - Channel Secret
   - Webhook URL設定（後で `https://your-domain/api/webhook` に設定）

#### B. Stripe テストモード設定
1. **Stripe Dashboard** でテストモード確認
2. **テスト用価格ID** 確認または作成:
   - 月額プラン用: `price_test_xxx`
   - 半年プラン用: `price_test_yyy`

#### C. 環境変数設定
`.env.local` を以下のように更新:
```env
# LINE Bot（テスト用）
LINE_CHANNEL_ACCESS_TOKEN=（新しいテスト用トークン）
LINE_CHANNEL_SECRET=（新しいテスト用シークレット）

# Stripe（テストモード）
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx
STRIPE_MONTHLY_PRICE_ID=price_test_monthly
STRIPE_BIANNUAL_PRICE_ID=price_test_biannual

# Firebase（同じプロジェクトでOK）
（既存設定をそのまま使用）
```

### 2. 現状確認・テスト
以下のスクリプトを実行して現状確認:

```bash
# 現在の問題を確認
node check-user-plan.js
node find-all-paid-users.js
node test-api-response.js
```

### 3. 修正が必要なファイル

#### A. `src/app/api/plan/current/route.ts`
**問題箇所**: 78行目の条件
```javascript
// 修正前
else if (subscriptionStatus === 'active' || subscriptionStatus === 'cancel_at_period_end') {

// 修正後  
else if (subscriptionStatus === 'active' || 
         subscriptionStatus === 'cancel_at_period_end' ||
         (subscriptionStatus === 'cancelled' && currentPeriodEnd && new Date() < currentPeriodEnd) ||
         subscriptionStatus === 'lifetime') {
```

#### B. lifetime ステータスの処理確認
`lifetime` ステータスが正しく処理されているか確認・修正

### 4. テスト手順

#### A. 新規課金テスト
1. **サーバー起動**: `npm run dev`
2. **テスト用LINEアカウント** でアクセス
3. **プラン設定画面** で半年プラン購入
4. **Stripeテスト決済** 実行（カード番号: `4242 4242 4242 4242`）
5. **プラン表示** が正しいか確認

#### B. 解約テスト  
1. **プラン解約ボタン** 押下
2. **期限まで継続表示** されるか確認
3. **期限後** に無料プラン表示に戻るか確認

#### C. 各ステータスのテスト
以下のユーザーデータパターンをテスト:
- `active` + `半年プラン`
- `cancelled` + `半年プラン` + 期限内
- `cancelled` + `半年プラン` + 期限切れ
- `lifetime` + `永久利用プラン`

### 5. 修正確認スクリプト
修正後、以下で動作確認:

```javascript
// test-fixed-api.js を作成して各パターンをテスト
const testCases = [
  { status: 'active', plan: '半年プラン', periodEnd: '2026-08-01' },
  { status: 'cancelled', plan: '半年プラン', periodEnd: '2026-08-01' },
  { status: 'cancelled', plan: '半年プラン', periodEnd: '2024-01-01' },
  { status: 'lifetime', plan: '永久利用プラン', periodEnd: null }
];
```

### 6. 本番適用
すべてのテストが成功したら:
1. **コード差分確認**
2. **本番環境にデプロイ**
3. **実際の課金ユーザーで確認**

## 🚨 注意事項
- **本番環境は触らない**
- **テスト環境でのみ修正作業**
- **Firebase は同じプロジェクトを使用**（データ分離は collection 名で）
- **Stripe はテストモードのみ**

## 📞 サポートが必要な場合
具体的な実装で詰まったら、この指示書と現在の状況を説明して Claude Code に相談してください。