---
id: SPEC-api-v0-contracts
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/specs/shared/SPEC-data-work-contract.md
  - docs/project/specs/shared/SPEC-data-event-log.md
subproject: contracts
---

# v0 API Contracts

## 概要

v0 HTTP API は `/api/v1` 配下に置き、resource 取得と command 実行を分ける。

## 関連要求

- `REQ-product-mvp-scope`
- `REQ-context-governance`
- `REQ-work-contract`
- `REQ-ai-cli-outsourcing`
- `REQ-evidence-verification`
- `REQ-repo-worktree-isolation`
- `REQ-workbench-review`
- `REQ-policy-event-audit`

## 入力

- resource query
- command request
- JSON Schema payload

## 出力

- resource response
- command result
- typed error
- Event link

## 挙動

- GET は resource endpoint とする。
- 状態変更は command endpoint とする。
- 永続 entity、event、contract payload は `schema_version` 必須。
- API error は `code`, `message`, `details`, `violations`, `event_id`, `request_id` を持つ。
- response は DB row ではなく `.owox/` 正本 model または projection model から構成する。

## 状態遷移 / 不変条件

- 状態遷移は command endpoint だけが実行する。
- command 成功時は必要な Event を返すか、後から辿れる link を返す。

## エラー / 例外

- Policy violation は typed error の `violations` に含める。
- schema_version 不一致は validation error。
- command の冪等性が必要な場合は request_id を検査する。

## 横断ルール

- OpenAPI は endpoint と error model を定義する。
- JSON Schema は entity、event、contract、evidence payload を定義する。

## 検証観点

- resource endpoint が状態変更しない。
- command endpoint が Event と接続される。
- typed error が UI で判定可能。

## 関連資料

- `../shared/SPEC-data-event-log.md`
- `../shared/SPEC-permission-policy-gate.md`
