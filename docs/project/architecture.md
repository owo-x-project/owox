# Architecture

## 目的

このファイルは、プロジェクト全体で守る不変条件、責務分離、設計方針を定義します。

## 読むべき場面

- 共通原則を変えるとき
- 責務境界を見直すとき
- 仕様や実装に横断影響があるとき

## 不変条件

### owox

- `owox` は Open Workspace Orchestrator として扱う。
- `owox` は AI Agent First な WebUI ベースの Terminal Workspace / 簡易 IDE とする。
- `owox` は code-server のようにブラウザから利用できることを絶対条件とする。
- `owox` v0 は owox workspace root 配下の複数 project repo を扱う。
- `owox` v0 は個人セルフホストを対象にする。multi-user / team 権限管理は v2 以降とする。
- `owox` v0 は PC、tablet、smartphone の各 viewport で主要操作を完了できる responsive UI を必須とする。
- `owox` は AI CLI、Git hosting、CI/CD、deployment service を置き換えない。
- `owox` v0 の AI CLI 連携は固有 adapter や agent runtime を持たず、任意 command の汎用 terminal session として扱う。
- `owox` v0 は Terminal / Session / Log / Git / File Tree / 簡易 Editor / Diff を必須機能とする。
- `owox` v0 は plugin manifest、command contribution、backend hook 予約を最小 extension point とする。汎用 plugin UI 実行基盤は v1 以降とする。

### owlcore

- `owlcore` は `owox` の裏側で使う project repo 紐づきの制御・記録レイヤーとする。
- `owlcore` は server 常駐型ではなく、完全に local / file-based な仕組みとする。
- `owlcore` の正本は project repo 内 `.owox/owlcore/` とする。
- `owlcore` は Project Metadata、Work Order、Work Contract、Context Capsule、Evidence、Verifier、Policy、Event Log、Agent Session 記録を扱う。
- `owlcore` は中央サーバー、daemon、remote database を前提にしない。
- `owlcore` v1 で Codex を最初の深い CLI adapter 候補とする。v0 `owox` では CLI 固有連携をしない。

## 責務分離

- `owox client`: UI rendering、layout、terminal renderer、editor、diff viewer、軽量 state、responsive interaction を担当する。
- `owox server`: HTTP API、WebSocket、PTY / process、terminal session reconnect、log stream、Git command、SQLite metadata を担当する。
- `owox managed DB`: project、session、log metadata、UI state を SQLite で管理する。永続化有無は Docker volume 運用に委ねる。
- `owox workspace root`: v0 で project repo を発見する filesystem root。直下の Git repo を project として扱う。
- `project repo`: source code と、v1 以降の `.owox/owlcore/` 正本を保持する。
- `external AI CLI`: Claude Code、Codex、OpenCode、Gemini CLI などの CLI 本体。v0 では `owox` が任意 command の terminal process として扱う。
- `owlcore`: repo 内正本、作業契約、証拠、検収、再現性を担当する。terminal process manager ではない。

## 設計方針

- WebUI / API server は分離する。
- server で処理すべきものは server、client で処理できるものは client に寄せ、セキュリティと負荷を最適化する。
- realtime 通信は WebSocket を主軸にする。
- terminal renderer は adapter 境界を置き、xterm.js と ghostty-web を prototype 比較できる構造にする。
- editor は LSP なしの簡易 editor とし、syntax highlight を提供する。フル IDE 化しない。
- Git UI は VS Code 標準 Source Control 相当を目指し、status、diff、stage、unstage、discard、commit、branch、fetch、pull、push、sync を扱う。PR / issue 連携は v0 外とする。
- responsive UI は同等操作を原則とし、smartphone では drawer、tabs、sheets で表示を切り替える。
- owlcore file format は human-readable snapshot と append-only log を分ける。metadata、contract、context、policy は YAML、event、evidence、session は JSONL を基本とする。

## 関連資料

- `index.md`
- `validation.md`
- `tech-stack.md`
- `requirements/owox/v0/index.md`
- `requirements/owlcore/v1/index.md`
