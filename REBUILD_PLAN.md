# F3RC Display システム 作り替え方針

## 現状の問題点

| 問題 | 詳細 |
|------|------|
| API キーがコードに露出 | `script.js` に5本の Google API キーをハードコード |
| Google Sheets 依存 | スコア変更に別端末でスプレッドシートを操作する必要がある |
| 5秒ポーリング | リアルタイム性が低く、API 制限を消費し続ける |
| コードの重複 | `fetchData1` `fetchData2` `fetchData3` はほぼ同一の関数 |
| 未定義変数 | `setting_flag` `regulation_flag` `prev_value` が参照されているが宣言なし |
| 音声ファイル不整合 | `Countdown06-2.mp3` が参照されているが存在しない |
| 表示制御の冗長さ | アイコン数の表示/非表示を if-else の連鎖で管理している |

---

## 新アーキテクチャ

```
[iPad: 入力画面]  [PC操作: タイマー・状態制御]
        │                    │
        └────────┬───────────┘
                 ↓ HTTP POST / WebSocket
          [Express サーバー (Node.js)]
                 │
          [PostgreSQL]
                 │
                 ↓ WebSocket push
         [PC: 表示画面 (display.html)]
```

### 旧構成との比較

| 項目 | 旧 | 新 |
|------|----|----|
| データソース | Google Sheets | PostgreSQL |
| 更新方式 | 5秒ポーリング | WebSocket プッシュ |
| 入力手段 | スプレッドシート手入力 | iPad 専用フォーム |
| API キー | コードに露出 | サーバー側で管理 |
| インターネット | 必要 | ローカルLAN のみで動作可能 |

---

## 画面構成

### 1. `display.html` — 表示画面（PC・プロジェクター）
現在の `main.html` の役割をそのまま引き継ぐ。  
WebSocket でサーバーからプッシュされたデータを受け取り即座に描画する。

### 2. `input.html` — スコア入力画面（iPad）
- 左右チームのスコア・アイテム数（パイン/チョコ/パン）を入力
- ボナペティ ON/OFF ボタン
- チーム名の入力

### 3. `control.html` — タイマー・進行制御画面（PC操作者）
- タイマー状態（set / setting timer / stop / ready / 本番）の切り替えボタン
- 現在の状態をリアルタイム確認

---

## ディレクトリ構成

```
f3rc2024_display/
├── server/
│   ├── app.js            # Express エントリーポイント
│   ├── routes/
│   │   ├── state.js      # GET/POST /api/state
│   │   └── timer.js      # POST /api/timer
│   ├── db.js             # PostgreSQL 接続
│   └── ws.js             # WebSocket ブロードキャスト
├── public/
│   ├── display.html      # 表示画面（旧 main.html）
│   ├── input.html        # iPad 入力画面
│   ├── control.html      # タイマー制御画面
│   ├── display.js        # 表示画面ロジック
│   ├── input.js          # 入力フォームロジック
│   ├── control.js        # 制御ボタンロジック
│   ├── style.css         # 旧 style.css をそのまま流用
│   └── images/           # 旧 images/ をそのまま流用
├── docker-compose.yml
├── Dockerfile
├── package.json
└── REBUILD_PLAN.md
```

---

## データモデル（PostgreSQL）

```sql
-- 試合の状態を1行で管理するシンプルな設計
CREATE TABLE match_state (
  id               SERIAL PRIMARY KEY,
  left_university  TEXT    DEFAULT '',
  right_university TEXT    DEFAULT '',
  left_score       INTEGER DEFAULT 0,
  right_score      INTEGER DEFAULT 0,
  left_pine        INTEGER DEFAULT 0,  -- 0〜5
  right_pine       INTEGER DEFAULT 0,
  left_choco       INTEGER DEFAULT 0,  -- 0〜5
  right_choco      INTEGER DEFAULT 0,
  left_bread       INTEGER DEFAULT 0,  -- 0〜3
  right_bread      INTEGER DEFAULT 0,
  left_bon         BOOLEAN DEFAULT FALSE,
  right_bon        BOOLEAN DEFAULT FALSE,
  timer_state      INTEGER DEFAULT 1,  -- 1:set 2:setting 3:stop 4:ready 5:running
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API 設計

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/api/state` | 現在の試合状態を返す |
| `POST` | `/api/state` | 試合状態を更新（部分更新可） |
| `POST` | `/api/timer` | タイマー状態のみを更新 |
| `POST` | `/api/reset` | 試合状態をリセット |

WebSocket: `ws://[host]:3000` — 状態が変わるたびにサーバーから全クライアントへブロードキャスト

---

## タイマー仕様（現行維持）

| `timer_state` | 表示 | 動作 |
|--------------|------|------|
| `1` | `set` | 待機表示 |
| `2` | `1:00` カウントダウン | セッティングタイマー60秒 |
| `3` | `stop` | 停止表示 |
| `4` | `ready` | レディ表示 |
| `5` | `3`→`2`→`1`→`GO!`→`3:00`→カウントダウン→`FINISH!` | 本番（音あり） |

タイマーのカウントダウンはクライアント側で処理する（`timer_state` が変わった瞬間にリセット）。  
※ `setting_flag` / `regulation_flag` の未定義バグはこのリセット検知ロジックで修正する。

---

## 実装ステップ

### Step 1: サーバー基盤（〜2時間）
- [ ] `package.json` 作成（express / ws / pg）
- [ ] `docker-compose.yml` 作成（Node.js + PostgreSQL）
- [ ] `app.js` に基本ルーティング
- [ ] `GET /api/state` と `POST /api/state` を実装
- [ ] PostgreSQL に `match_state` テーブル作成

### Step 2: WebSocket 追加（〜1時間）
- [ ] `ws.js` でブロードキャスト機能を実装
- [ ] `POST /api/state` 更新時に全クライアントへ通知

### Step 3: display.html 移植（〜2時間）
- [ ] 旧 `main.html` + `script.js` のレイアウトを維持
- [ ] ポーリングを WebSocket 受信に置き換え
- [ ] アイコン表示ロジックをループで書き直し（if-else 連鎖を廃止）
- [ ] タイマーのリセット検知ロジックを修正

### Step 4: input.html 作成（〜1時間）
- [ ] iPad 向けの大きいフォーム
- [ ] 各フィールドを `POST /api/state` に送信

### Step 5: control.html 作成（〜1時間）
- [ ] タイマー状態を切り替えるボタン群
- [ ] リセットボタン

---

## 移行時に流用するもの

- `display/images/` — 画像素材はそのまま
- `display/style.css` / `display/style2.css` — レイアウトはそのまま
- `display/start.mp3` — 音声ファイル（パスを修正）
- 背景・UIデザイン全般

## 捨てるもの

- Google Sheets API 依存
- 複数 API キー管理
- `fetchData1` / `fetchData2` / `fetchData3` の重複コード
- コメントアウトされた大量の旧コード

---

## 用語解説

### サーバー・通信系

#### サーバー

> ほかの端末（クライアント）からのリクエストを受け取り、データを返したり処理したりするプログラム／マシン。  
> 今回は自分の PC でサーバーを動かし、iPad や表示用 PC がそこに繋ぎにいくイメージ。

#### クライアント

> サーバーにリクエストを送る側。ブラウザで `display.html` を開いている PC や iPad がクライアント。

#### Node.js

> JavaScript をブラウザの外（PC 上）で動かす実行環境。  
> 今回はサーバープログラムを JavaScript で書くために使う。

#### Express

> Node.js 用の Web サーバーフレームワーク（ライブラリの集まり）。  
> 「このURL にアクセスされたらこの処理をする」という書き方を簡単にしてくれる。

#### ローカル LAN

> 同じ Wi-Fi や有線ネットワークにつながっている機器だけが通信できる閉じたネットワーク。  
> インターネットに出ないので、Google の API 制限や外部への情報漏洩を気にしなくてよい。

---

### データのやり取り系

#### API (Application Programming Interface)

> プログラム同士がデータをやり取りするための「窓口」。  
> 今回は Express サーバーに作った URL がそれにあたる（例: `/api/state`）。

#### API キー

> API を使う権限を証明するパスワードのようなもの。  
> 現在は Google Sheets の API キーがコードに直書きされており、GitHub に上げると誰でも使えてしまう状態。

#### HTTP GET / POST

> Web でデータをやり取りするときの「操作の種類」。
>
> - `GET` … データを取得する（読み取り専用）
> - `POST` … データを送信・更新する（書き込み）

#### ポーリング

> 「変化があったか？」を一定間隔で繰り返し確認する方式。  
> 今の `setInterval` で5秒ごとに Google API を叩いているのがこれ。変化がなくても毎回通信が発生するので無駄が多い。

#### WebSocket

> サーバーとクライアントが「繋ぎっぱなし」になる通信方式。  
> サーバー側でデータが変わった瞬間に、クライアント全員へ即座に送りつけることができる（プッシュ）。  
> ポーリングと違い、変化があるときだけ通信するので効率的でリアルタイム性が高い。

↑ここまで読んだよ
#### ブロードキャスト

> 繋がっている全員に同じデータを一斉送信すること。  
> 今回は「スコアが更新されたら、表示画面・制御画面・入力画面すべてに同時に通知する」という使い方をする。

#### JSON (JavaScript Object Notation)

> データを `{ "key": "value" }` の形式で表したテキスト。  
> API でデータを送受信するときの共通フォーマットとして使う。

---

### データベース系

#### データベース (DB)

> データを永続的に保存・管理するソフトウェア。  
> 今の構成ではサーバーのメモリ（変数）に入れているだけなので、サーバーを再起動するとデータが消える。DB を使うと消えなくなる。

#### PostgreSQL

> 無料で使えるオープンソースのデータベース。表（テーブル）形式でデータを管理する。  
> Excel のシートに似ているが、複数の画面から同時に読み書きしてもデータが壊れない仕組みが備わっている。

#### SQL

> データベースを操作するための専用言語。  
> `CREATE TABLE`（表を作る）・`INSERT`（行を追加）・`SELECT`（取得）・`UPDATE`（更新）・`DELETE`（削除）が基本。

#### テーブル

> データベース内の「表」。行と列でデータを管理する。Excel のシートに相当する。

#### SERIAL PRIMARY KEY

> 行を追加するたびに自動で 1, 2, 3, … と連番が振られる列。各行を一意に識別するために使う。

#### DEFAULT

> 値を指定しなかったときに自動で入る初期値。`DEFAULT 0` なら何も指定しなければ 0 になる。

#### BOOLEAN

> `TRUE` か `FALSE` の2値しか入らない型。今回はボナペティが表示されているかどうかの管理に使う。

#### TIMESTAMPTZ

> タイムゾーン付きの日時型。「いつ更新されたか」を記録するために使う。

---

### 環境・ツール系

#### Docker

> アプリとその動作に必要な環境をまとめてパッケージ化（コンテナ化）するツール。  
> 「自分の PC では動くのに本番では動かない」という問題を防げる。

#### Docker Compose

> 複数のコンテナ（今回は Node.js サーバーと PostgreSQL）をまとめて起動・管理するための設定ファイル（`docker-compose.yml`）と CLI ツール。  
> `docker compose up` の1コマンドでサーバーと DB を同時に立ち上げられる。

#### コンテナ

> アプリとその依存関係を1つに固めた軽量な実行単位。仮想マシンより起動が速く、環境を使い捨てにできる。

#### package.json

> Node.js プロジェクトの設定ファイル。使用するライブラリ（express, ws, pg など）の一覧と、`npm install` で一括インストールできる情報が書かれている。

#### npm

> Node.js のパッケージ（ライブラリ）管理ツール。`npm install` でライブラリをダウンロードして使えるようにする。

#### ルーティング

> 「どの URL にアクセスされたら、どの処理を実行するか」を振り分ける仕組み。  
> 例: `/api/state` にアクセスされたら試合状態を返す、`/api/reset` にアクセスされたらリセット処理をする。

#### エントリーポイント

> プログラムが最初に読み込まれるファイル。今回は `app.js` がそれにあたる。

---

### コード品質系

#### ハードコード

> 値をコードの中に直接べた書きすること。  
> API キーをコードに書くと、ファイルをそのまま共有した際に流出してしまう。

#### リファクタリング

> 動作は変えずにコードの構造・読みやすさを改善すること。  
> 今回は `fetchData1` / `fetchData2` / `fetchData3` の重複を1つの関数にまとめる作業がこれにあたる。

#### 未定義変数

> 使おうとしているが、どこにも `let` / `const` / `var` で宣言されていない変数。  
> JavaScript では実行時にエラーか予期しない動作を引き起こす。現行コードの `setting_flag` がこれ。
