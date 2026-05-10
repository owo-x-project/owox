# ADR-0002 Repo Backed Owox Store

## 状態

採用。

## 判断

Owox v0 は、project 由来の Context、Work Contract、Evidence、Event、検収結果の正本を、対象 project repo 内の `.owox/` に置く Git 管理ファイルとして扱う。

`.owox/` の Event は append-only JSONL、entity snapshot は JSON を基本形式とする。SQLite は正本ではなく、一覧、検索、UI 高速化、projection、cache、index のための再構築可能な補助ストアとする。

## 背景

Owox は AI 作業の文脈、契約、証拠、検収、監査を扱う制御プレーンである。これらの情報は、対象 project のコード変更と同じく Git 上で review、diff、rollback、clone できるほうが、監査と検収の思想に合う。

将来の v1 では、会社的情報も 1 つの repository として管理する可能性がある。v0 では scope を広げすぎず、各 project repo の `.owox/` を正本配置として始める。

## 代替案

- SQLite を正本にする: query と実装は単純だが、Git による review、diff、rollback、clone と相性が悪く、project 由来データの監査正本が DB 内に閉じるため不採用。
- DB を完全に使わない: 正本の単純さは高いが、Workbench の一覧、検索、横断 query、projection が重くなりやすいため不採用。
- 最初から company repo を正本にする: v1 の思想には合うが、v0 の Managed Repo / Task worktree / Evidence の核より scope が広がるため不採用。

## 理由

- `.owox/` を Git 管理することで、Context、Contract、Evidence、Event を project の変更と近い場所で追跡できる。
- Event を JSONL append-only にすると、監査記録と再生がしやすい。
- Entity snapshot を JSON にすると、schema 検査と人間確認の両方を扱いやすい。
- SQLite を projection/cache に限定すると、Workbench の応答性を確保しつつ、正本破損や DB migration 失敗が監査データ喪失に直結しない。

## 影響

- `docs/project/architecture.md` の source of truth と責務分離を更新する。
- `docs/project/tech-stack.md` の SQLite 役割を projection/cache に変更する。
- `crates/owox-store` 相当の責務を spec で定義する必要がある。
- API response は DB row ではなく、`.owox/` 正本 model または projection model から構成する。
- Verifier と Policy は `.owox/` 正本、Git diff、Evidence を検査根拠にする。

## 関連資料

- `../../architecture.md`
- `../../tech-stack.md`
- `../../requirements/v0/REQ-repo-worktree-isolation.md`
- `../../requirements/v0/REQ-policy-event-audit.md`
- `../../requirements/v0/REQ-evidence-verification.md`
