# 🚀 クイックスタートガイド

## 最速セットアップ（Docker使用）

### Step 1: Docker Desktopを起動
- Windows/Mac: Docker Desktop アプリを開く
- Linux: `systemctl start docker`

### Step 2: プロジェクトディレクトリに移動
```bash
cd f3rc2024_display
```

### Step 3: Docker Composeで起動
```bash
docker-compose up --build
```

出力例：
```
f3rc_postgres_1  | database system is ready to accept connections
f3rc_node_1      | Server running on http://0.0.0.0:3000
```

✅ **完了！**

---

## アクセス

### 1️⃣ ホームページ（リンク集）
```
http://localhost:3000
```

### 2️⃣ 表示画面（PC/プロジェクター用）
```
http://localhost:3000/display.html
```
※ フルスクリーンモードを使用するか、ブラウザを最大化してください

### 3️⃣ 入力画面（iPad/スマートフォン用）
別のデバイスから：
```
http://[PC_IP_ADDRESS]:3000/input.html
```
※ 同じWiFiネットワークに接続している必要があります

IPアドレスを確認する：
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```
`192.168.x.x` のようなアドレスを探してください

### 4️⃣ 制御画面（PC操作者用）
```
http://localhost:3000/control.html
```

---

## 動作テスト

### シナリオ 1: スコア更新のテスト

**デバイスA（iPad）:**
1. 入力画面を開く → `http://[IP]:3000/input.html`
2. 「左チーム」のチーム名を入力 → 「東京大学」
3. スコアの「+」ボタンを複数回クリック
4. 「送信」ボタンをクリック ✅ メッセージ表示

**デバイスB（PC表示画面）:**
1. 別ウィンドウで表示画面を開く → `http://localhost:3000/display.html`
2. デバイスAで送信直後に画面に反映される ⚡ **リアルタイム！**

### シナリオ 2: タイマーテスト

**デバイスC（制御画面）:**
1. 制御画面を開く → `http://localhost:3000/control.html`
2. 「SET」ボタンをクリック → display に `set` 表示
3. 「START」ボタンをクリック → 3秒カウント開始
   - 3 → 2 → 1 → GO! → 3:00 → 2:59 → ...

---

## トラブルシューティング

### ❌ "Cannot get image" エラー
```
unable to get image 'f3rc2024_display-node': error during connect
```
**解決策:** Docker Desktop を起動してください

### ❌ "Connection refused" エラー
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**解決策:** サーバーが起動していることを確認
```bash
docker-compose logs
```

### ❌ iPad から localhost:3000 にアクセスできない
**解決策:** 

1. PCのIPアドレスを確認
```bash
# Windows
ipconfig
# 192.168.x.x を確認
```

2. iPad のアドレスバーに入力
```
http://192.168.1.100:3000/input.html
```
（`192.168.1.100` はあなたのPC IPに置き換え）

### ❌ WebSocket接続エラー
ブラウザのコンソール（F12）でエラーを確認
```javascript
// 以下を実行して疎通確認
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log)
```

---

## ストップ・ログ確認

### サーバーを停止
```bash
docker-compose down
```

### ログを確認
```bash
# 全ログ
docker-compose logs

# Node.jsのみ
docker-compose logs f3rc_node

# PostgreSQLのみ
docker-compose logs f3rc_postgres

# リアルタイム監視
docker-compose logs -f
```

### データベース確認（PostSQL）
```bash
# PostgreSQL コンテナに接続
docker exec -it f3rc_postgres psql -U f3rc_user -d f3rc_display

# テーブル確認
\dt
SELECT * FROM match_state;

# 抜ける
\q
```

---

## よくある質問

### Q1: 複数のiPadから同時に入力できる？
✅ **はい！** WebSocketが各デバイスからの更新を同時に処理できます。最後の更新が反映されます。

### Q2: オフラインで使える？
✅ **はい！** ローカルLANのみで動作するため、インターネット不要です。

### Q3: データは保存される？
✅ **はい！** PostgreSQL データベースに保存されます。  
コンテナを停止しても、`postgres_data` ボリュームがあればデータは保持されます。

### Q4: 複数の試合を管理できる？
❌ 現在は1試合のみです。複数試合対応は拡張機能として検討できます。

### Q5: 古いスプレッドシートのデータを移行できる？
✅ 可能です。 `server/init.sql` を編集して、初期データを挿入できます。

---

## 本番運用チェックリスト

- [ ] すべての画面が同じWiFiネットワークに接続している
- [ ] 表示画面（display.html）がフルスクリーン表示されている
- [ ] 音声ファイル（start.mp3）が `public/` に存在する
- [ ] 背景画像（background.png）が `public/images/` に存在する
- [ ] タイマー音量テストを実施
- [ ] 本番前に空の試合でテスト実行

---

## より詳しい情報

詳細は [README.md](./README.md) をご覧ください。

---

**楽しい試合を！** 🎮
