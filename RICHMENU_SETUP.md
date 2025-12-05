# 3ボタンリッチメニュー手動設定ガイド

## LINE Developers コンソールでの設定方法

1. https://developers.line.biz/console/ にアクセス
2. チャンネルを選択
3. 「Messaging API」→「Rich menu」
4. 「Create」で新規作成

## リッチメニュー設定

### 基本設定
- **名前**: 3ボタンリッチメニュー
- **サイズ**: Large (2500x843)
- **Chat bar text**: メニュー

### ボタンエリア設定（3つ）

#### 1. マイページボタン（左）
- **座標**: x=0, y=0
- **サイズ**: width=833, height=843
- **アクション**: Postback
- **Data**: action=open_dashboard
- **Label**: マイページ

#### 2. フィードバックボタン（中央）
- **座標**: x=833, y=0  
- **サイズ**: width=834, height=843
- **アクション**: Postback
- **Data**: action=daily_feedback
- **Label**: フィードバック

#### 3. 使い方ボタン（右）
- **座標**: x=1667, y=0
- **サイズ**: width=833, height=843  
- **アクション**: Postback
- **Data**: action=usage_guide
- **Label**: 使い方

### 画像
rich-menu-final.png を使用（2500x843px）

### 設定後
- 「Set as default」でデフォルトリッチメニューに設定

## 変更点
- 元の4ボタンから「記録」ボタンを削除
- 統一モードで「記録」キーワードで記録処理