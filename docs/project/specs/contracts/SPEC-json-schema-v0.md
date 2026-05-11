---
id: SPEC-json-schema-v0
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/specs/contracts/SPEC-api-v0-contracts.md
  - docs/project/specs/shared/SPEC-data-event-log.md
subproject: contracts
---

# v0 JSON Schema

## 概要

v0 JSON Schema は `.owox/` 正本、HTTP API、Rust protocol 型の共通契約。Entity / Event / Evidence / Contract を分割し、各 payload は `schema_version` を持つ。

## 関連要求

- `REQ-product-mvp-scope`
- `REQ-context-governance`
- `REQ-work-contract`
- `REQ-ai-cli-outsourcing`
- `REQ-evidence-verification`
- `REQ-policy-event-audit`

## 入力

- `.owox/` JSON snapshot
- `.owox/` JSONL Event record
- command request payload
- Evidence payload
- Handoff payload

## 出力

- JSON Schema validation result
- OpenAPI component schema
- Rust protocol 型との対応表

## 挙動

- schema は `contracts/schemas/v0/` 配下に置く。
- contract fixture は `contracts/fixtures/v0/{valid,invalid}/` 配下に置く。
- `examples/` は人間向けサンプルに限定し、contract fixture の正本にしない。
- 共通 primitive は `common/` に置き、entity / event / evidence / command から参照する。
- 全永続 payload は `id`, `schema_version`, `created_at`, `updated_at` を持つ。ただし Event は `updated_at` を持たない。
- ID は prefix + ULID 形式。prefix は entity 種別ごとに固定する。
- timestamp は RFC 3339 UTC 文字列。
- enum は JSON Schema の `enum` と spec の状態遷移を一致させる。

## Field 定義

### Entity 共通

- required: `id`, `schema_version`, `created_at`, `updated_at`
- optional: `labels`, `links`, `metadata`
- enum: `schema_version = "v0"`

### Context

- required: `id`, `schema_version`, `kind`, `state`, `title`, `body`, `source`, `created_at`, `updated_at`
- enum: `kind = raw | proposed | official`, `state = draft | proposed | approved | rejected | archived`
- migration: `body` の構造変更は新 field 追加で行い、既存 field の意味変更は禁止。

### WorkOrder

- required: `id`, `schema_version`, `repo_id`, `title`, `goal`, `state`, `created_at`, `updated_at`
- enum: `state = draft | ready | running | submitted | verified | accepted | rejected | needs_revision | cancelled | failed`
- migration: state 追加時は API filter、UI badge、Verifier fixture を同時更新する。

### WorkContract

- required: `id`, `schema_version`, `work_order_id`, `revision`, `allowed_paths`, `forbidden_paths`, `required_evidence`, `acceptance_criteria`, `created_at`, `updated_at`
- enum: `required_evidence.kind = diff | test_result | command_log | artifact | review_note | verifier_report | schema_validation | contract_fixture_result | ui_check_result | git_inspection_result | handoff_record`
- migration: `revision` は単調増加。過去 revision は上書きしない。

### Session

- required: `id`, `schema_version`, `work_order_id`, `contract_id`, `adapter_kind`, `state`, `worktree_id`, `created_at`, `updated_at`
- enum: `adapter_kind = manual | opencode`, `state = draft | ready | running | submitted | failed | cancelled | verified | accepted | rejected | needs_revision`
- migration: adapter 固有 field は `adapter_payload` に閉じる。

### Evidence

- required: `id`, `schema_version`, `work_order_id`, `kind`, `subject`, `content_ref`, `created_at`, `updated_at`
- enum: `kind = diff | log | test_result | command_log | artifact | review_note | verifier_report | schema_validation | contract_fixture_result | ui_check_result | git_inspection_result | handoff_record`
- migration: 大きな本文は `content_ref` 参照へ移し、一覧 payload へ含めない。

### HandoffRecord

- required: `id`, `schema_version`, `work_order_id`, `acceptance_decision_id`, `repo_id`, `source_branch`, `head_commit`, `target_branch`, `state`, `evidence_links`, `decision_event_id`, `created_at`, `updated_at`
- optional: `trace_marker`, `pr_body_draft`, `last_inspected_at`, `integration_check`
- enum: `state = ready_for_merge | integrated | stale`
- migration: external Git service の PR / MR state は HandoffRecord の正本 field にしない。必要な場合も projection / metadata として扱う。

### Event

- required: `id`, `schema_version`, `type`, `actor`, `occurred_at`, `subject`, `reason`, `result`, `links`
- enum: `result.status = succeeded | failed | blocked | cancelled`
- migration: Event は append-only。誤記補正は `event.corrected` を追加する。

### PolicyRule / Violation

- required: `rule_code`, `severity`, `blocking`, `message`, `subject`
- enum: `severity = info | warning | error | critical`
- migration: rule code は削除しない。無効化は `deprecated: true` を付ける。

## 状態遷移 / 不変条件

- schema_version は API version とは独立。
- `required` の削除や enum 意味変更は破壊的変更。v0 内では禁止。
- nullable と missing は区別する。未設定は原則 missing。

## エラー / 例外

- schema validation 失敗は `VALIDATION_SCHEMA` typed error。
- enum 不一致は `422`。
- unknown field は command request では reject、保存済み entity の読み込みでは warning として Event に残す。

## 横断ルール

- OpenAPI component は JSON Schema と同名にする。
- Rust 型は schema 名と 1:1 に近い対応を保つ。
- migration は projection rebuild test を通す。

## 検証観点

- schema fixture が valid / invalid の両方を持つ。
- `.owox/` snapshot と JSONL Event を schema validation できる。
- enum 追加時に API / UI / Verifier の更新漏れを検出できる。
- HandoffRecord valid / invalid fixture が Git 履歴判定に必要な field を持つ。
- `contracts/fixtures/v0/valid/` と `contracts/fixtures/v0/invalid/` が testkit から読める。

## 関連資料

- `SPEC-api-v0-contracts.md`
- `../shared/SPEC-data-event-log.md`
- `../shared/SPEC-data-owox-layout.md`
