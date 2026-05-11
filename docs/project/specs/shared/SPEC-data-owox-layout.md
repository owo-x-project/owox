---
id: SPEC-data-owox-layout
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/adr/active/ADR-0002-repo-backed-owox-store.md
  - docs/project/specs/contracts/SPEC-json-schema-v0.md
---

# .owox Layout

## 概要

`.owox/` は project 由来の Context、Work Contract、Evidence、Event、検収結果の正本。Entity snapshot は種類別 JSON、Event は月次 JSONL、index は projection 再構築用の最小情報に限定する。

## 関連要求

- `REQ-repo-worktree-isolation`
- `REQ-policy-event-audit`
- `REQ-evidence-verification`

## 入力

- command result
- entity snapshot
- append-only Event
- Evidence artifact reference

## 出力

- `.owox/` 正本 tree
- projection rebuild input
- Git diff review 対象

## 挙動

- root は repo 直下の `.owox/`。
- directory は entity 種別ごとに分ける。
- snapshot file は `<entity_id>.json`。
- Event file は `.owox/events/YYYY/MM.jsonl`。
- index file は entity ID、state、updated_at、参照先 path だけを持つ。
- lock は `.owox/locks/*.lock` の advisory lock。lock file は Git 管理しない。

## File path 命名

- `.owox/manifest.json`
- `.owox/index/entities.json`
- `.owox/contexts/<context_id>.json`
- `.owox/work-orders/<work_order_id>.json`
- `.owox/contracts/<contract_id>/rev-<revision>.json`
- `.owox/sessions/<session_id>.json`
- `.owox/evidence/<evidence_id>.json`
- `.owox/evidence/artifacts/<evidence_id>/<filename>`
- `.owox/handoffs/<handoff_id>.json`
- `.owox/policies/rules.json`
- `.owox/policies/results/<policy_result_id>.json`
- `.owox/events/YYYY/MM.jsonl`
- `.owox/snapshots/projection-checkpoint.json`

## JSONL 分割単位

- Event JSONL は月次分割。
- 1 record = 1 Event Envelope。
- 1 行の trailing comma 禁止。
- record が大きい場合は artifact file へ逃がし、Event は `content_ref` を持つ。

## 状態遷移 / 不変条件

- Event は追記のみ。既存行の変更は禁止。
- snapshot は最新状態を表す。状態変更時は Event 追記と snapshot 更新を同一 command transaction として扱う。
- projection は `.owox/manifest.json`、index、snapshot、events から再構築できる。
- HandoffRecord は Owox の merge 可否判断と Git 履歴判定の起点を表す snapshot。外部 PR / MR state は正本にしない。

## エラー / 例外

- lock 取得失敗は `STORE_LOCK_BUSY`。
- snapshot と Event の entity revision が不一致なら `STORE_INTEGRITY_MISMATCH`。
- Git conflict 中の `.owox/` 更新は command を中断する。

## 横断ルール

- `.owox/locks/`、一時 file、SQLite DB は Git 管理しない。
- 手編集を許す file は JSON Schema validation 対象にする。
- artifact は secret path 判定を通す。
- external Git service の webhook / provider API state は `.owox/` 正本にしない。

## 検証観点

- fresh clone から projection を再構築できる。
- 月次 JSONL を順に replay して snapshot と一致する。
- lock 競合時に二重 write しない。
- `.owox/handoffs/<handoff_id>.json` から head commit と target branch を読み、Git 履歴判定を再実行できる。

## 関連資料

- `../../adr/active/ADR-0002-repo-backed-owox-store.md`
- `../contracts/SPEC-json-schema-v0.md`
- `SPEC-data-event-log.md`
