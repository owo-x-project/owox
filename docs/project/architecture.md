# Architecture

## 目的

このファイルは、プロジェクト全体で守る不変条件、責務分離、設計方針を定義します。

## 読むべき場面

- 共通原則を変えるとき
- 責務境界を見直すとき
- 仕様や実装に横断影響があるとき

## 不変条件

- Owox は AI coding CLI や Git hosting を置き換えない。文脈、作業契約、権限、証拠、検収、監査を管理する制御プレーンとして扱う。
- Raw input や inbox 資料は直接 Official Context にしない。Proposed Context と Review / Policy Gate を経て正式化する。
- AI の完了報告だけで完了扱いにしない。Evidence と Verifier による検収を必須にする。
- 外部契約は Contract first で扱う。JSON Schema、OpenAPI、Workspace layout、State transition、Event Envelope を優先して固定する。
- 本番 runtime では WebUI server を常駐させず、静的 build を `owoxd` から配信する方針を初期案とする。

## 責務分離

- `contracts`: Work Contract、Context Capsule、Evidence Report、Event などの外部契約を定義する。
- `crates/owox-protocol`: 外部契約に対応する Rust 型を持つ。他の Owox crate に依存しない。
- `crates/owox-core`: domain logic と状態遷移を持つ。DB、HTTP、Git、filesystem write、process spawn、UI に依存しない。
- `crates/owox-db`: SQLite 永続化、migration、repository、projection を担当する。DB row や SQLx 型を外へ漏らさない。
- `crates/owox-git`: Git CLI と worktree 操作を担当する。DB に依存しない。
- `crates/owox-verifier`: Evidence と diff を検査する。UI 表示ではなく Rust 側の changed paths と Evidence を検査対象にする。
- `crates/owox-server`: HTTP API と静的 WebUI 配信、domain command orchestration を担当する。
- `apps/web`: Owox Workbench の静的 WebUI を担当する。

## 設計方針

- Core before UI。Protocol、Core、DB、API、Git / Verifier、WebUI、Adapter の順に固める。
- API は `/api/v1` 配下に置き、contract payload は API version と別に `schema_version` を持つ。
- 状態遷移は command endpoint として表現し、DB row を API response として直接返さない。
- 一覧 API は大きな本文を返しすぎず、metadata と詳細取得を分ける。
- monorepo の task は小さく保ち、1 task につき対象 crate は原則 1 つ、多くても 2 つにする。

## 関連資料

- `index.md`
- `validation.md`
- `tech-stack.md`
- `adr/active/ADR-0001-initial-architecture-and-stack.md`
