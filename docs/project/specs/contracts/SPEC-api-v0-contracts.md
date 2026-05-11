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

## Endpoint 一覧

### Workspace / repo

- `GET /api/v1/health`
  - request: なし。
  - response: `{ "status": "ok", "schema_version": "v0" }`
  - status code: `200`
- `GET /api/v1/repos`
  - request: query `cursor`, `limit`
  - response: `RepoListResponse`
  - status code: `200`, `400`
- `POST /api/v1/repos/commands/register`
  - command 名: `repo.register`
  - request: `RegisterRepoCommand`
  - response: `CommandAcceptedResponse<Repo>`
  - status code: `201`, `400`, `409`, `422`

### Context

- `GET /api/v1/contexts`
  - request: query `state`, `kind`, `cursor`, `limit`
  - response: `ContextListResponse`
  - status code: `200`, `400`
- `GET /api/v1/contexts/{context_id}`
  - request: path `context_id`
  - response: `Context`
  - status code: `200`, `404`
- `POST /api/v1/contexts/commands/propose`
  - command 名: `context.propose`
  - request: `ProposeContextCommand`
  - response: `CommandAcceptedResponse<Context>`
  - status code: `201`, `400`, `422`
- `POST /api/v1/contexts/{context_id}/commands/approve`
  - command 名: `context.approve`
  - request: `ApproveContextCommand`
  - response: `CommandAcceptedResponse<Context>`
  - status code: `200`, `404`, `409`, `422`
- `POST /api/v1/contexts/{context_id}/commands/reject`
  - command 名: `context.reject`
  - request: `RejectContextCommand`
  - response: `CommandAcceptedResponse<Context>`
  - status code: `200`, `404`, `409`, `422`

### Work order / contract

- `GET /api/v1/work-orders`
  - request: query `state`, `repo_id`, `cursor`, `limit`
  - response: `WorkOrderListResponse`
  - status code: `200`, `400`
- `POST /api/v1/work-orders/commands/create`
  - command 名: `work_order.create`
  - request: `CreateWorkOrderCommand`
  - response: `CommandAcceptedResponse<WorkOrder>`
  - status code: `201`, `400`, `422`
- `POST /api/v1/work-orders/{work_order_id}/commands/generate-contract`
  - command 名: `work_contract.generate`
  - request: `GenerateWorkContractCommand`
  - response: `CommandAcceptedResponse<WorkContract>`
  - status code: `201`, `404`, `409`, `422`
- `GET /api/v1/contracts/{contract_id}`
  - request: path `contract_id`
  - response: `WorkContract`
  - status code: `200`, `404`

### Session / AI CLI

- `GET /api/v1/sessions`
  - request: query `state`, `adapter_kind`, `work_order_id`, `cursor`, `limit`
  - response: `SessionListResponse`
  - status code: `200`, `400`
- `GET /api/v1/sessions/{session_id}`
  - request: path `session_id`
  - response: `Session`
  - status code: `200`, `404`
- `POST /api/v1/sessions/commands/start`
  - command 名: `session.start`
  - request: `StartSessionCommand`
  - response: `CommandAcceptedResponse<Session>`
  - status code: `201`, `400`, `409`, `422`
- `GET /api/v1/sessions/{session_id}/stream`
  - request: path `session_id`, query `after`
  - response: Server-Sent Events または JSONL stream `SessionStreamEvent`
  - status code: `200`, `404`, `409`
- `POST /api/v1/sessions/{session_id}/commands/input`
  - command 名: `session.input`
  - request: `SendSessionInputCommand`
  - response: `CommandAcceptedResponse<SessionInputEvent>`
  - status code: `202`, `404`, `409`, `422`
- `POST /api/v1/sessions/{session_id}/commands/cancel`
  - command 名: `session.cancel`
  - request: `CancelSessionCommand`
  - response: `CommandAcceptedResponse<Session>`
  - status code: `202`, `404`, `409`
- `POST /api/v1/sessions/{session_id}/commands/retry`
  - command 名: `session.retry`
  - request: `RetrySessionCommand`
  - response: `CommandAcceptedResponse<Session>`
  - status code: `201`, `404`, `409`, `422`

### Evidence / acceptance

- `GET /api/v1/evidence`
  - request: query `work_order_id`, `session_id`, `kind`, `cursor`, `limit`
  - response: `EvidenceListResponse`
  - status code: `200`, `400`
- `POST /api/v1/evidence/commands/register`
  - command 名: `evidence.register`
  - request: `RegisterEvidenceCommand`
  - response: `CommandAcceptedResponse<Evidence>`
  - status code: `201`, `400`, `422`
- `POST /api/v1/verifier/commands/run`
  - command 名: `verifier.run`
  - request: `RunVerifierCommand`
  - response: `CommandAcceptedResponse<VerifierRun>`
  - status code: `202`, `400`, `404`, `409`, `422`
- `POST /api/v1/work-orders/{work_order_id}/commands/accept`
  - command 名: `work_order.accept`
  - request: `AcceptWorkOrderCommand`
  - response: `CommandAcceptedResponse<AcceptanceDecision>`
  - status code: `200`, `404`, `409`, `422`
- `POST /api/v1/work-orders/{work_order_id}/commands/reject`
  - command 名: `work_order.reject`
  - request: `RejectWorkOrderCommand`
  - response: `CommandAcceptedResponse<AcceptanceDecision>`
  - status code: `200`, `404`, `409`, `422`
- `POST /api/v1/work-orders/{work_order_id}/commands/request-revision`
  - command 名: `work_order.request_revision`
  - request: `RequestRevisionCommand`
  - response: `CommandAcceptedResponse<AcceptanceDecision>`
  - status code: `200`, `404`, `409`, `422`

### Repo diff / events / policy

- `GET /api/v1/repos/{repo_id}/diffs/{worktree_id}`
  - request: path `repo_id`, `worktree_id`
  - response: `DiffSummary`
  - status code: `200`, `404`, `409`
- `GET /api/v1/handoffs`
  - request: query `work_order_id`, `state`, `cursor`, `limit`
  - response: `HandoffListResponse`
  - status code: `200`, `400`
- `GET /api/v1/handoffs/{handoff_id}`
  - request: path `handoff_id`
  - response: `HandoffRecord`
  - status code: `200`, `404`
- `POST /api/v1/work-orders/{work_order_id}/commands/create-handoff`
  - command 名: `handoff.create`
  - request: `CreateHandoffCommand`
  - response: `CommandAcceptedResponse<HandoffRecord>`
  - status code: `201`, `404`, `409`, `422`
- `POST /api/v1/handoffs/{handoff_id}/commands/refresh-from-git`
  - command 名: `handoff.refresh_from_git`
  - request: `RefreshHandoffFromGitCommand`
  - response: `CommandAcceptedResponse<HandoffRecord>`
  - status code: `200`, `404`, `409`, `422`
- `GET /api/v1/events`
  - request: query `subject_id`, `type`, `cursor`, `limit`
  - response: `EventListResponse`
  - status code: `200`, `400`
- `GET /api/v1/policy/rules`
  - request: なし。
  - response: `PolicyRuleListResponse`
  - status code: `200`

## 共通 request / response

- command request は `request_id`, `actor`, `reason`, `payload` を持つ。
- command response は `id`, `schema_version`, `command`, `status`, `entity`, `event_id`, `links` を持つ。
- list response は `items`, `next_cursor`, `schema_version` を持ち、大きな本文は detail endpoint で取得する。
- `409` は状態不整合、同時更新、実行中 session などの conflict。
- `422` は schema validation、policy violation、contract violation。

## 状態遷移 / 不変条件

- 状態遷移は command endpoint だけが実行する。
- command 成功時は必要な Event を返すか、後から辿れる link を返す。
- `accepted` は Owox の検収完了であり、外部 merge 完了ではない。
- Handoff integrated / stale は Git 履歴 refresh command により projection として更新する。

## エラー / 例外

- Policy violation は typed error の `violations` に含める。
- schema_version 不一致は validation error。
- command の冪等性が必要な場合は request_id を検査する。
- Git 履歴判定失敗は HandoffRecord を破壊せず typed error で返す。

## 横断ルール

- OpenAPI は endpoint と error model を定義する。
- JSON Schema は entity、event、contract、evidence payload を定義する。

## 検証観点

- resource endpoint が状態変更しない。
- command endpoint が Event と接続される。
- typed error が UI で判定可能。
- Handoff create / refresh が provider API や webhook なしで動く。

## 関連資料

- `../shared/SPEC-data-event-log.md`
- `../shared/SPEC-permission-policy-gate.md`
- `SPEC-json-schema-v0.md`
