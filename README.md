# LINE健康管理アプリ

AIを活用した個人向け健康管理サービス。LINEと連携して、食事管理、運動記録、健康アドバイスを提供します。

## 🎯 プロジェクト概要

- **目的**: LINEを使った個人向け健康管理サービス
- **特徴**: 食事写真のAI分析、パーソナライズされたアドバイス、LINE UI/UXに馴染むデザイン
- **収益モデル**: フリーミアム（基本機能無料、詳細分析月額980円）

## 🔧 技術スタック

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **LINE LIFF SDK**
- **shadcn/ui**
- **Recharts** (グラフ表示)

### Backend (予定)
- **Python + FastAPI** (Google Cloud Run)
- **Node.js** (Firebase Functions - Webhook処理)

### Database & Storage (予定)
- **Firestore** (メインDB)
- **Cloud Storage** (画像保存)
- **Redis** (AIレスポンスキャッシュ)

### AI & APIs (予定)
- **Google Gemini Pro API** (画像・テキスト分析)
- **OpenAI GPT-4** (補助的なアドバイス生成)
- **LINE Messaging API**

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # メインページ
│   ├── counseling/        # カウンセリング機能
│   └── dashboard/         # ダッシュボード
├── components/
│   └── ui/                # shadcn/ui コンポーネント
├── types/
│   └── index.ts           # TypeScript型定義
├── utils/                 # ユーティリティ関数
│   ├── calculations.ts    # BMI、カロリー計算など
│   └── date.ts           # 日付・時刻処理
├── constants/
│   └── index.ts          # 定数定義
├── contexts/             # React Context (予定)
├── hooks/                # カスタムフック (予定)
└── services/             # API呼び出し (予定)
```

## 🚀 開発環境セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.example` を参考に `.env.local` を作成し、必要な環境変数を設定してください。

### 3. 開発サーバーの起動
```bash
npm run dev
```

アプリケーションは [http://localhost:3000](http://localhost:3000) でアクセスできます。

## 📋 実装済み機能

### Phase 1: 基本機能 ✅
- [x] Next.js 15 プロジェクト初期化
- [x] TypeScript型定義の整備
- [x] shadcn/ui コンポーネント導入
- [x] メインページ（ランディング）
- [x] 健康カウンセリングフォーム
- [x] ダッシュボードページ（基本UI）
- [x] BMI・カロリー計算ユーティリティ

### Phase 1.5: LINE Bot連携 ✅
- [x] Webhook APIエンドポイント
- [x] LIFF認証システム
- [x] LINE Bot基本応答機能
- [x] ユーザー認証フロー

### Phase 2: 食事管理 🚧 (準備中)
- [ ] 食事写真アップロード機能
- [ ] Gemini AIによる食事内容分析
- [ ] カロリー・栄養素の自動計算
- [ ] 食事履歴の可視化

### Phase 3: 総合健康管理 🚧 (準備中)
- [ ] 体重記録・推移グラフ
- [ ] 運動記録機能
- [ ] 日次・週次・月次レポート
- [ ] 目標設定・達成度追跡

## 🎨 UIコンポーネント

shadcn/uiを使用した再利用可能なコンポーネント：
- Button, Card, Input, Label, Textarea
- Progress (プログレスバー)
- モバイルファーストなレスポンシブデザイン

## 📊 データモデル

主要な型定義は `src/types/index.ts` で管理：
- `User`: ユーザー情報
- `UserProfile`: 健康プロファイル
- `DailyRecord`: 日次記録
- `Meal`: 食事情報
- `Exercise`: 運動記録
- `CounselingResult`: カウンセリング結果

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# TypeScript型チェック
npx tsc --noEmit

# Linter実行
npm run lint
```

## 🌐 デプロイ

- **Frontend**: Vercel (GitHub連携)
- **Backend**: Google Cloud Run (予定)

## 📝 今後の開発計画

1. **LINE LIFF連携の完全実装**
2. **Firebase/Firestore統合**
3. **AI画像分析機能の実装**
4. **リアルタイム健康レポート**
5. **管理栄養士相談機能**

## 📧 お問い合わせ

開発に関するご質問やご提案は、プロジェクトのIssueまでお願いします。

---

**🚀 本格展開に向けて開発中です！**
