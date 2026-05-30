# owox

[English version](README.md)

**Open Workspace Orchestrator** — ブラウザから端末操作、ファイル編集、Git管理ができる、自分専用のワークスペース。

owox を使うと、ブラウザ上で端末を開いてコマンドを実行したり（対話型の開発支援ツールも含む）、ファイルを閲覧・編集したり、Gitの操作を行ったりできます。パソコン、タブレット、スマートフォンのどの画面からでも操作できます。

> 現在のバージョンは個人での利用を想定しています。複数人での利用やチーム向けの権限管理には対応していません。

## 主な機能

- **端末** — ブラウザ上であらゆるコマンドを実行できます。ページを再読み込みしても操作の続きから再開でき、入出力の履歴は自動で保存されます。
- **開発支援ツール連携** — Claude Code, Codexなどの対話型開発支援ツールを、通常の端末操作としてそのまま起動できます。特別な設定は不要で、端末で動くものならそのまま使えます。
- **ファイル管理** — プロジェクトのファイルをツリー形式で閲覧し、構文の色分け付きで編集できます。複数箇所から同時に編集した場合の競合も自動で検出します。
- **Git操作** — 変更の確認、コミット、差分表示、ブランチ切り替え、プッシュ、プルなど、一般的なソース管理パネルと同等の操作ができます。取り消しの難しい操作には必ず確認が入ります。
- **マルチデバイス対応** — 画面の大きさに合わせて表示が自動で切り替わります。スマートフォンでは各パネルがスライド表示になり、すべての機能にアクセスできます。
- **複数プロジェクト管理** — Gitリポジトリが入ったフォルダを指定するだけで、中のプロジェクトを自動で検出し、切り替えながら作業できます。

## 導入方法

### 実行ファイルをダウンロードする

[リリースページ](https://github.com/owoDra/owox/releases)からお使いの環境に合った圧縮ファイルをダウンロードし、展開してください。中に含まれる `owox-server` がサーバー本体、`dist/` フォルダがブラウザ画面の本体です。

```bash
# 例：Linuxx64 の場合
tar xzf owox-v0.1.0-x86_64-unknown-linux-gnu.tar.gz
cd owox
OWOX_WORKSPACE_ROOT=/path/to/your/repos ./owox-server
```

ブラウザで **http://localhost:3000** を開いてください。

### Dockerで起動する

```bash
docker compose up --build
# http://localhost:3000 を開く
```

`compose.yaml` 内のフォルダ指定を、ご自身のリポジトリがあるフォルダに書き換えてください。データは名前付きボリュームで永続化されます。

### ソースコードからビルドする

必要なもの：Rust 1.85 以上、Node 20 以上、Git、Bash。

```bash
git clone https://github.com/owoDra/owox.git
cd owox
npm install
npm run build
cargo build --release -p owox-server
OWOX_WORKSPACE_ROOT=/path/to/your/repos ./target/release/owox-server
```

ブラウザで **http://localhost:3000** を開いてください。

## 使い方

1. `OWOX_WORKSPACE_ROOT` にGitリポジトリが入ったフォルダを指定します。
2. `owox-server` を起動します。
3. ブラウザで **http://localhost:3000** を開きます。
4. サイドバーからプロジェクトを選び、端末を開いたり、ファイルを編集したり、ブランチを管理したりできます。

## 設定

| 変数名 | 初期値 | 説明 |
| --- | --- | --- |
| `OWOX_WORKSPACE_ROOT` | 現在のフォルダ | Gitリポジトリが入ったフォルダ |
| `OWOX_DATABASE_URL` | `sqlite://owox.sqlite3?mode=rwc` | メタデータ保存先 |
| `OWOX_DATA_DIR` | `.owox-data` | ログや実行時データの保存先 |
| `OWOX_STATIC_DIR` | `dist` | ブラウザ画面の配信元フォルダ |

サーバーは `0.0.0.0:3000` で待ち受けます。

## 開発

```bash
# 端末その1：サーバーを起動
OWOX_WORKSPACE_ROOT=/path/to/your/repos cargo run -p owox-server

# 端末その2：フロントエンド開発サーバーを起動（通信はポート3000へ中継）
npm run dev
```

ブラウザで **http://localhost:5173** を開いてください。

### 検証コマンド

```bash
cargo test --workspace        # サーバー側テスト
cargo clippy --workspace      # サーバー側コード検査
npm run typecheck             # 型検査
npm test                      # フロントエンド側テスト
npm run lint                  # コードスタイル検査
```

## ライセンス

MIT License。詳細は [LICENSE](LICENSE) をご覧ください。
