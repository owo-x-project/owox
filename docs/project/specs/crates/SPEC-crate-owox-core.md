---
id: SPEC-crate-owox-core
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/specs/contracts/SPEC-json-schema-v0.md
  - docs/project/specs/shared/SPEC-state-context-governance.md
  - docs/project/specs/shared/SPEC-data-work-contract.md
  - docs/project/specs/shared/SPEC-flow-evidence-acceptance.md
subproject: crates
---

# owox-core

## 概要

`owox-core` は Owox の domain logic と状態遷移を扱う crate。純 domain として実装し、DB、Git、filesystem、HTTP、process spawn、UI に依存しない。

## 関連要求

- `REQ-context-governance`
- `REQ-work-contract`
- `REQ-evidence-verification`
- `REQ-policy-event-audit`

## 入力

- protocol command payload
- current entity state
- `CommandContext`
- policy precheck input
- Evidence / Verifier summary
- Git handoff inspection result

## 出力

- updated entity
- Event Envelope draft
- policy precheck result
- acceptance decision
- handoff decision
- typed domain error

## 挙動

- module は `context`, `work`, `session`, `acceptance`, `policy`, `handoff`, `command_context`, `errors` に分ける。
- public API は command 関数型にする。
- `handle_*` は command、current state、`CommandContext` を受け、updated entity、events、policy precheck を返す。
- IO は caller が実行する。
- ID と時刻は外部注入する。
- `CommandContext` は `now`, `ids`, `actor`, `request_id`, `reason` を持つ。
- required evidence は変更種別 template で初期化する。
- evidence template の追加 / 緩和は reason を要求する。

## Public API

- `command_context`
  - `CommandContext`
  - `IdProvider`
  - `FixedCommandContext` は testkit 側で提供する
- `context`
  - `handle_context_propose`
  - `handle_context_approve`
  - `handle_context_reject`
  - `handle_context_deprecate`
- `work`
  - `handle_work_order_create`
  - `handle_work_contract_generate`
  - `select_required_evidence_template`
- `session`
  - `handle_session_start`
  - `handle_session_submit`
  - `handle_session_fail`
  - `handle_session_cancel`
- `acceptance`
  - `handle_verification_recorded`
  - `handle_work_order_accept`
  - `handle_work_order_reject`
  - `handle_work_order_request_revision`
- `handoff`
  - `handle_handoff_create`
  - `handle_handoff_integrated`
  - `handle_handoff_stale`
- `policy`
  - `precheck_official_context_direct_write`
  - `precheck_required_reason`
- `errors`
  - typed domain error enum with stable code

## 状態遷移 / 不変条件

- Raw Context は direct Official 化できない。
- Session に渡した Work Contract revision は immutable。
- required evidence 不足時は `accepted` にできない。
- blocking policy violation がある場合は accept できない。
- `accepted` は Owox の Evidence / Verifier / human gate 通過を意味し、外部 merge 完了ではない。
- `HandoffRecord` state は `ready_for_merge`, `integrated`, `stale` のみ扱う。
- `integrated` は handoff head commit が target branch history に含まれる検査結果から更新する。

## エラー / 例外

- 不正状態遷移は stable code `CORE_INVALID_STATE_TRANSITION`。
- required reason 欠落は stable code `CORE_REASON_REQUIRED`。
- contract revision 不一致は stable code `CORE_CONTRACT_REVISION_MISMATCH`。
- blocking policy violation 付き accept は stable code `CORE_ACCEPTANCE_BLOCKED`。

## 横断ルール

- `owox-core` は `owox-protocol` に依存できる。
- `owox-core` は `owox-store`, `owox-db`, `owox-git`, `owox-server` に依存しない。
- Event は core で draft を作り、store が schema validation と永続化を行う。
- domain error は server 境界で API typed error に変換する。

## 検証観点

- context state transition の positive / negative tests。
- Work Contract generation が required evidence template を含む。
- accept が verifier failure / evidence missing / human reason missing を拒否する。
- HandoffRecord が ready_for_merge から integrated / stale へ遷移できる。
- ID/time 注入により deterministic test が書ける。

## 関連資料

- `../../architecture.md`
- `../shared/SPEC-state-context-governance.md`
- `../shared/SPEC-data-work-contract.md`
- `../shared/SPEC-flow-evidence-acceptance.md`
