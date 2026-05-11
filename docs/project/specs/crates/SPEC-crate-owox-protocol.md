---
id: SPEC-crate-owox-protocol
status: 採用
related:
  - docs/project/specs/contracts/SPEC-json-schema-v0.md
  - docs/project/specs/contracts/SPEC-api-v0-contracts.md
  - docs/project/specs/shared/SPEC-data-event-log.md
subproject: crates
---

# owox-protocol

## 概要

`owox-protocol` は JSON Schema / OpenAPI に対応する Rust 型と validation 境界を持つ crate。外部契約を Rust 側で扱うための型を提供し、domain logic は持たない。

## 関連要求

- `REQ-product-mvp-scope`
- `REQ-context-governance`
- `REQ-work-contract`
- `REQ-ai-cli-outsourcing`
- `REQ-evidence-verification`
- `REQ-policy-event-audit`

## 入力

- `contracts/schemas/v0/` の JSON Schema
- `contracts/openapi/` の OpenAPI component
- `.owox/` entity / event / evidence / contract JSON
- API command request / response JSON
- Session stream event JSON

## 出力

- `.owox/` 永続 payload 用 Rust 型
- API command / response / typed error 用 Rust 型
- Session stream event 用 Rust 型
- schema validation result
- `Validated<T>`

## 挙動

- JSON Schema / OpenAPI を正本とし、Rust 型は同期検証対象にする。
- module は `common`, `context`, `work`, `session`, `evidence`, `event`, `policy`, `api`, `stream` に分ける。
- `.owox/` entity / event / evidence / contract、command DTO、API response / error、stream event を含める。
- domain logic、状態遷移、policy 判定、DB / Git / HTTP / filesystem 操作は含めない。
- Serde parse と schema validation を分ける。
- 境界 crate は `validate_*` を明示的に呼び、成功時に `Validated<T>` を得る。
- `schema_version` は v0 に統一する。

## Public API

- `common`
  - `SchemaVersion`
  - `EntityId`
  - `ActorRef`
  - `Timestamp`
  - `Metadata`
  - `LinkRef`
- `context`
  - `Context`
  - `ContextState`
  - `ContextKind`
  - `ContextCapsule`
- `work`
  - `WorkOrder`
  - `WorkOrderState`
  - `WorkContract`
  - `WorkContractRevision`
  - `RequiredEvidence`
  - `AcceptanceCriteria`
- `session`
  - `Session`
  - `SessionState`
  - `AdapterKind`
- `evidence`
  - `Evidence`
  - `EvidenceKind`
  - `VerifierReport`
- `event`
  - `EventEnvelope`
  - `EventResult`
- `policy`
  - `PolicyRule`
  - `PolicyViolation`
  - `PolicySeverity`
- `api`
  - command request / response DTO
  - list response DTO
  - `ApiError`
- `stream`
  - `SessionStreamEvent`
- validation
  - `Validated<T>`
  - `validate_json(schema_name, value)`
  - `validate_persisted_payload<T>(value)`
  - `validate_command_payload<T>(value)`

## 状態遷移 / 不変条件

- `owox-protocol` は状態遷移を実行しない。
- enum は JSON Schema と一致する。
- API version と `schema_version` は独立する。
- unknown field は command request では reject、保存済み entity 読み込みでは warning へ変換できる形で保持する。
- stable error code / policy violation code は文字列を変えない。

## エラー / 例外

- schema validation 失敗は stable code `VALIDATION_SCHEMA` を返す。
- enum 不一致は validation error。
- required field 欠落は validation error。
- `schema_version` 不一致は validation error。

## 横断ルール

- HTTP / CLI command 入力時と store 書き込み前に schema validation を必須にする。
- Rust 型と schema / OpenAPI component の差分は contract fixture test で検出する。
- `owox-core` は protocol 型を入力 / 出力に使えるが、protocol は core に依存しない。

## 検証観点

- valid fixture を parse できる。
- invalid fixture が validation error になる。
- schema enum と Rust enum が一致する。
- API typed error が UI 判定可能な field を持つ。
- `Validated<T>` なしの保存 payload を store 書き込み境界で拒否できる。

## 関連資料

- `../contracts/SPEC-json-schema-v0.md`
- `../contracts/SPEC-api-v0-contracts.md`
- `../shared/SPEC-data-event-log.md`
