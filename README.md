# owox

**Open Workspace Orchestrator** — ブラウザから使える AI Agent First な WebUI ベースの Terminal Workspace / 簡易 IDE。

`owox` は code-server のようにブラウザから開き、workspace root 直下の複数 Git リポジトリを project として扱います。terminal session（AI CLI を含む任意 command）、file tree、簡易 editor、diff、Git 操作、log を、PC / tablet / smartphone のいずれの画面でも操作できます。

> v0 は個人セルフホスト前提です。マルチユーザー / チーム権限管理は対象外です。

## 主な機能（v0）

- **Project**: workspace root 直下の Git リポジトリを自動検出して切り替え
- **Terminal**: PTY ベースの session 起動 / 入出力 / resize / 終了、WebSocket 双方向 IO、log 永続化とブラウザ reload 後の reconnect 復元
- **AI CLI**: Claude Code / Codex / Gemini CLI などを「固有 adapter なしの任意 command」として terminal session で起動・監視
- **Files**: 遅延展開の file tree と CodeMirror 6 の簡易 editor（楽観ロックによる保存衝突検出）
- **Git**: VS Code 標準 Source Control 相当（status / diff / stage / unstage / discard / commit / branch / fetch / pull / push / sync）。破壊的操作は明示確認を必須化
- **Diff / Log**: unified / split diff 表示、範囲読み込み対応の log viewer
- **Responsive**: smartphone は方向付き sheet（terminal=下 / files=左 / review=右 / command palette=上）+ full-screen editor
- **Plugin（予約境界）**: manifest / command contribution の read のみ。任意コード実行 endpoint は持たない

セキュリティ境界: 全 path は workspace boundary 内に強制（traversal / symlink 拒否）、破壊的操作は confirmation token 必須、terminal / git 出力は保存・配信前に secret redaction。

## 技術スタック

| 層 | 採用 |
| --- | --- |
| Server | Rust + Axum + Tokio（PTY: portable-pty） |
| Client | TypeScript + Solid + Vite |
| Editor / Terminal | CodeMirror 6 / xterm.js（renderer は差し替え可能な adapter 境界） |
| Metadata DB | SQLite + sqlx（project / session / log / UI state） |
| Realtime | WebSocket（MessagePack envelope） |
| Packaging | Docker |

詳細は `docs/project/architecture.md` / `docs/project/tech-stack.md` を参照。

## 前提ツール

- **Rust** stable（edition 2024 のため 1.85 以降）
- **Node.js** 20 以降 + npm
- **git** と **bash**（Git 操作と terminal session の実行に必須）

## ローカル起動

### 1. 依存インストール

```bash
npm install
# Rust 依存は cargo が初回ビルド時に取得
```

### 2. 開発モード（推奨: server + Vite を別プロセスで）

owox は workspace root 直下の Git リポジトリを project として検出します。検出させたいリポジトリ群を含むディレクトリを `OWOX_WORKSPACE_ROOT` に指定してください。

```bash
# ターミナル A: API / WebSocket サーバ（http://localhost:3000）
OWOX_WORKSPACE_ROOT=/path/to/your/repos cargo run -p owox-server

# ターミナル B: Vite 開発サーバ（http://localhost:5173、/api と WS を 3000 にプロキシ）
npm run dev
```

ブラウザで **http://localhost:5173** を開きます。

> ヒント: 試す用に `OWOX_WORKSPACE_ROOT` 配下へ `git init` 済みのディレクトリを 1 つ以上置いてください。直下の Git リポジトリのみが project として表示されます（再帰探索はしません）。

### 3. 単一バイナリで起動（ビルド済みフロントを Rust サーバが配信）

```bash
npm run build      # dist/ に静的アセットを生成
OWOX_WORKSPACE_ROOT=/path/to/your/repos cargo run -p owox-server
# OWOX_STATIC_DIR は既定で dist。dist があれば SPA として配信される
```

ブラウザで **http://localhost:3000** を開きます。

### 4. Docker（セルフホスト）

```bash
docker compose up --build
# http://localhost:3000
```

`compose.yaml` の `./workspace` をあなたのリポジトリ群ディレクトリに置き換えてください。SQLite / log は名前付き volume `owox-data`（`/data`）で永続化します。詳細は `docs/project/plan/v0/phase-06-plugin-packaging-release/PACKAGING.md`。

## 環境変数

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| `OWOX_WORKSPACE_ROOT` | カレントディレクトリ | project repo を発見する root（直下の Git repo を project 化） |
| `OWOX_DATABASE_URL` | `sqlite://owox.sqlite3?mode=rwc` | managed metadata の SQLite |
| `OWOX_DATA_DIR` | `.owox-data` | log など runtime データ（project repo の外に置く） |
| `OWOX_STATIC_DIR` | `dist` | 配信する静的フロント（存在時のみ SPA fallback を有効化） |
| `OWOX_PLUGINS_DIR` | `<data_dir>/plugins` | plugin manifest の読み込み元（任意） |

サーバは `0.0.0.0:3000` で待ち受けます。

## テスト / 静的検査

```bash
cargo test --workspace      # Rust unit + integration
cargo clippy --workspace    # Rust lint
npm run typecheck           # TypeScript 型チェック
npm test                    # client unit (vitest)
npm run lint                # Biome (lint + format check)
npm run build               # 本番ビルド
```

## ディレクトリ構成

```
apps/server/        Rust サーバ（Axum router、routes/ ドメイン別、state/error）
crates/owox-core/   コアサービス（workspace boundary, db, fs, log_store, terminal, git, plugin, http/ws contract）
src/                Solid フロント（api/, events/, features/{shell,projects,files,log,terminal,git,feedback,plugins}）
tests/client/       client ユニットテスト
docs/project/       プロジェクト正本（要件 / 仕様 / ADR / plan / patterns）
Dockerfile, compose.yaml   セルフホスト用 packaging
```

## v0 の状態と既知の制約

v0 の完了判定・カバレッジは `docs/project/plan/v0/phase-06-plugin-packaging-release/RELEASE-VALIDATION.md` を参照。主な follow-up:

- terminal renderer の default 確定（ADR-0003 の xterm vs ghostty-web 比較は未実施。現状 xterm が暫定 default、ghostty は seam のみの stub）
- ブラウザ E2E（現状は reducer ユニットテスト + API workflow smoke + 手動 viewport checklist）
- `docker build` の実機スモーク（本リポジトリの検証環境に daemon なし）
- log retention の enforcement 配線、フロント bundle の code-split

## ライセンス

UNLICENSED（社内 / 個人利用）。
