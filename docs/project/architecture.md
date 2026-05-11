# Architecture

## 目的

このファイルは、プロジェクト全体で守る不変条件、責務分離、設計方針を定義します。

## 読むべき場面

- 共通原則を変えるとき
- 責務境界を見直すとき
- 仕様や実装に横断影響があるとき

## 不変条件

- `owox` は AI Agent First な Terminal Workspace / plugin host として扱う。
- `owox` は AI coding CLI や Git hosting を置き換えない。AI CLI / agent process の起動、監視、操作、terminal session、diff、preview、logs、approvals、plugin UI host を担当する。
- 現 Owox の文脈、作業契約、権限、証拠、検収、監査を管理する制御プレーン思想は、公式 plugin `owlcore` に継承する。
- `owlcore` は server なしで project repo に紐づく。必須 runtime は CLI / library / owox plugin とし、常駐 HTTP daemon を前提にしない。
- Raw input や inbox 資料は直接 Official Context にしない。Proposed Context と Review / Policy Gate を経て正式化する。
- AI の完了報告だけで完了扱いにしない。Evidence と Verifier による検収を必須にする。
- 外部契約は Contract first で扱う。plugin API、plugin manifest、plugin UI mount、repo layout、state transition、event envelope、schema を優先して固定する。
- `owlcore` 由来の Context、Work Contract、Evidence、Event、検収結果の正本は、対象 project repo 内の `.owox/owlcore/` に置く Git 管理ファイルとする。
- SQLite などの DB は必要な場合のみ projection / cache / index として扱い、正本ではない。cache は `.owox/owlcore/` 正本から再構築できる必要がある。
- `owox` / `owlcore` は外部 Git service の PR / MR 作成、review、merge、webhook state sync を中核責務にしない。
- plugin 固有 UI は `owox` の中核拡張面として扱う。`owlcore` の Context / Work / Evidence UI は `owlcore` plugin UI として提供する。
- Brand Repo / brand context は v2 以降の追加機能候補とし、v1 `owlcore` project repo 管理の中核には含めない。

## 責務分離

- `owox`: Terminal Workspace、agent/session/process 操作、plugin host、plugin UI host、approvals、diff、preview、logs を担当する。
- `owox plugin API`: plugin manifest、permission、command、UI mount、event bridge、host capability を定義する。
- `plugins/owlcore`: Context / Work / Evidence 制御プレーンを担当する公式 plugin。
- `owlcore-cli`: project repo 内 `.owox/owlcore/` の初期化、context、work、evidence、verifier、doctor を扱う。
- `owlcore-core`: domain logic と状態遷移を持つ。DB、HTTP、process spawn、UI に依存しない。
- `owlcore-store`: `.owox/owlcore/` 配下の正本ファイル、append-only event、entity snapshot、rebuild stream を担当する。
- `owlcore-git`: Git CLI、worktree、changed paths、diff、Git 履歴判定を担当する。Git provider API に依存しない。
- `owlcore-verifier`: Work Contract、Evidence、diff、Policy を検査する。
- `owlcore-cache`: 必要な場合だけ projection / cache / index を担当する。正本にはしない。

## 設計方針

- Host before plugins。v0 は `owox` plugin host / plugin UI / terminal workspace を先に固める。
- `owlcore` は v1 で公式 plugin として実装する。
- Plugin contract first。plugin manifest、permission、command、UI mount、host capability、repo layout、schema を先に固定する。
- `.owox/owlcore/` の Event は JSONL の append-only record、entity snapshot は JSON を基本形式とする。
- server API first ではなく、CLI / library / plugin API first とする。HTTP API は必要になるまで必須にしない。
- monorepo の task は小さく保ち、1 task につき対象 crate は原則 1 つ、多くても 2 つにする。

## 関連資料

- `index.md`
- `validation.md`
- `tech-stack.md`
- `adr/active/ADR-0001-initial-architecture-and-stack.md`
- `adr/active/ADR-0002-repo-backed-owox-store.md`
- `adr/active/ADR-0003-owox-owlcore-product-split.md`
