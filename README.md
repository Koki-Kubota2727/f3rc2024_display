# F3RC 2.0 リアルタイムディスプレイシステム

## 概要

このシステムは、スマートフォン（iPad）から試合情報をリアルタイムで入力し、PC/プロジェクターの大画面に即座に反映させるシステムです。

### 主な特徴
- ✅ **WebSocketによるリアルタイム通信** - 遅延なくデータ共有
- ✅ **ローカルLANのみで動作** - インターネット不要、外部API依存なし
- ✅ **3つの画面構成** - 表示・入力・制御が独立
- ✅ **PostgreSQLデータベース** - 安定したデータ管理
- ✅ **Docker対応** - どの環境でも同じ動作

## 新しい構成

```
iPad: 入力画面 (input.html)
  ↓
  ├→ PC: 制御画面 (control.html)
  │
  └→ Express WebServer
       ├ PostgreSQL Database
       │
       └→ PC: 表示画面 (display.html) ← WebSocket受信
```

## ディレクトリ構成

```
f3rc2024_display/
├── server/                      # Node.js サーバー
│   ├── app.js                   # Express メインアプリケーション
│   ├── db.js                    # PostgreSQL接続設定
│   ├── ws.js                    # WebSocket ブロードキャスト機能
│   ├── routes/
│   │   ├── state.js             # GET/POST /api/state
│   │   └── timer.js             # POST /api/timer
│   └── init.sql                 # PostgreSQL初期化スクリプト
├── public/                      # フロントエンド（HTML/CSS/JS）
│   ├── index.html               # ホームページ
│   ├── display.html             # 表示画面
│   ├── display.js               # 表示画面ロジック
│   ├── input.html               # 入力画面
│   ├── input.js                 # 入力画面ロジック
│   ├── control.html             # 制御画面
│   ├── control.js               # 制御画面ロジック
│   ├── style.css                # スタイルシート
│   └── images/                  # 背景画像など
├── docker-compose.yml           # Docker Compose設定
├── Dockerfile                   # Node.js Docker イメージ定義
├── package.json                 # Node.js 依存パッケージ
├── package-lock.json            # 依存パッケージバージョン確定版
└── REBUILD_PLAN.md              # 要件定義書
```

## セットアップ手順

### 前提条件
- Docker & Docker Compose がインストールされていること
- 同じWiFiネットワークに接続されているデバイス

### 1. Docker環境で起動（推奨）

```bash
cd f3rc2024_display
docker-compose up --build
```

- **PostgreSQL** は `postgres:15-alpine` で自動起動
- **Node.js** は `node:18-alpine` で自動起動
- サーバーは `http://localhost:3000` でアクセス可能

### 2. ローカル環境で起動（開発用）

Docker Desktopが起動していない場合は、ローカルでPostgreSQLを起動してから以下を実行：

```bash
# 1. PostgreSQL を起動（別ターミナル）
# Windows: PostgreSQL の管理者パネルから起動、または：
psql -U postgres

# 2. データベースを作成
createdb f3rc_display

# 3. テーブルを初期化
psql -U postgres -d f3rc_display -f server/init.sql

# 4. Node.js サーバーを起動
npm install
npm start
```

## アクセス方法

### ホームページ（ナビゲーション）
```
http://localhost:3000
```
→ 3つの画面へのリンクを表示

### 表示画面（PC/プロジェクター）
```
http://localhost:3000/display.html
または
http://[サーバーのIP]:3000/display.html
```
- スマートフォンから入力されたデータをリアルタイム表示
- タイマーを自動カウントダウン
- 大画面向けのレイアウト

### 入力画面（iPad/スマートフォン）
```
http://[サーバーのIP]:3000/input.html
```
- 左右チームのチーム名を入力
- スコア、アイテム数（パイナップル、チョコ、パンケーキ）を入力
- ボナペティのON/OFF切り替え
- 「送信」ボタンでサーバーに送信

### 制御画面（PC操作者）
```
http://localhost:3000/control.html
または
http://[サーバーのIP]:3000/control.html
```
- タイマー状態を制御
  - **SET** (1): 待機状態
  - **SETTING** (2): セッティングタイマー（60秒カウント）
  - **STOP** (3): 停止
  - **READY** (4): レディ状態
  - **START** (5): 本番実行（3→2→1→GO!→3分カウント）
- 試合全体をリセット

## API一覧

### 状態取得
```
GET /api/state
```
現在のマッチ状態をJSON形式で返す

**レスポンス例:**
```json
{
  "id": 1,
  "left_university": "東京大学",
  "right_university": "京都大学",
  "left_score": 150,
  "right_score": 120,
  "left_pine": 5,
  "right_pine": 4,
  "left_choco": 3,
  "right_choco": 2,
  "left_bread": 2,
  "right_bread": 3,
  "left_bon": true,
  "right_bon": false,
  "timer_state": 5,
  "updated_at": "2026-07-12T14:50:26.123456+09:00"
}
```

### 状態更新
```
POST /api/state
Content-Type: application/json

{
  "left_score": 160,
  "left_pine": 4,
  "left_bon": false
}
```
部分更新が可能。変更したフィールドのみ指定してOK

### タイマー状態更新
```
POST /api/timer
Content-Type: application/json

{
  "timer_state": 5
}
```

### 全体リセット
```
POST /api/reset
```
すべてのスコアと状態をリセット

### WebSocket
```
ws://[host]:3000
```
状態変更時にリアルタイムでブロードキャスト

**メッセージ例:**
```json
{
  "type": "state_update",
  "data": { ...state_object... }
}
```

## 動作確認

### 1. サーバー起動確認
```bash
# ブラウザでアクセス
http://localhost:3000/health
```
`{"status":"ok"}` が返ってくれば正常

### 2. 表示画面で確認
```bash
# PC/プロジェクター用
http://localhost:3000/display.html
```

### 3. 入力画面でテスト
```bash
# スマートフォンブラウザで
http://[PC_IP]:3000/input.html

# スコアを変更して「送信」
# display.html に即座に反映されるか確認
```

### 4. 制御画面でタイマーテスト
```bash
# 別のPCなどで
http://localhost:3000/control.html

# START ボタンを押す
# 3→2→1→GO!→3:00...と表示されるか確認
```

## トラブルシューティング

### Docker起動時に `dockerDesktopLinuxEngine` エラー
→ Docker Desktop を起動してください（Windows/Mac用）

### PostgreSQL接続エラー
→ `docker-compose logs` でエラーログを確認

### WebSocket接続失敗
→ ファイアウォール設定を確認  
→ 同じWiFiネットワークに接続しているか確認

### 画面に "loading..." で固まる
→ ブラウザの開発者ツール（F12）でコンソールエラーを確認  
→ `ws://` ではなく `wss://` が必要な場合があります（HTTPS環境）

## 旧システムからの改善点

| 項目 | 旧システム | 新システム |
|------|---------|---------|
| データソース | Google Sheets | PostgreSQL |
| 更新方式 | 5秒ポーリング | WebSocket プッシュ |
| API キー | コード内に5個露出 | サーバー側で管理 |
| インターネット | 必須 | ローカルLANのみ |
| コードの冗長性 | fetchData1〜3重複 | ループで統一 |
| アイコン表示 | if-else 連鎖30+ | ループ処理 |

## 開発メモ

### 既存ファイルの流用
- `display/images/` → `public/images/` にコピー
- `display/style.css` → `public/style.css`
- `display/start.mp3` → `public/start.mp3`

### 音声再生
HTML `<audio id="music" src="start.mp3"></audio>` を使用  
JavaScript で `document.getElementById('music').play()` で再生

### セッション管理
入力画面のデータはブラウザの localStorage に保存  
ページをリロードしてもフォーム内容が復元される

## ライセンス

F3RC 2024 - Real-time Display System

---

問題が発生した場合は、REBUILD_PLAN.md の用語解説を参照してください。
