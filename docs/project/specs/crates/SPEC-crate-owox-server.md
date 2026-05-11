---
id: SPEC-crate-owox-server
status: 採用
related:
  - docs/project/specs/contracts/SPEC-api-v0-contracts.md
  - docs/project/specs/shared/SPEC-flow-ai-cli-session.md
  - docs/project/specs/crates/SPEC-crate-owox-core.md
  - docs/project/specs/crates/SPEC-crate-owox-store.md
  - docs/project/specs/crates/SPEC-crate-owox-db.md
subproject: crates
---

# owox-server

## 概要

`owox-server` は HTTP API、静的 WebUI 配信、domain command orchestration、OpenCode Managed Process を扱う crate。

## 関連要求

- `REQ-product-mvp-scope`
- `REQ-ai-cli-outsourcing`
- `REQ-workbench-review`

## 入力

- HTTP request
- command request
- Session control request
- app configuration

## 出力

- HTTP response
- typed error
- Event
- Session stream

## 挙動

- `/api/v1` endpoint を `SPEC-api-v0-contracts` に従って公開する。
- 状態変更は command endpoint だけで行う。
- OpenCode process 起動、stream、interactive input、cancel、retry を管理する。
- WebUI static build を配信する。
- route handler は DTO / HTTP 変換だけを担当する。
- `AppService` が `owox-core`, `owox-store`, `owox-db`, `owox-git`, `owox-verifier` を順に呼ぶ。
- command request は境界で schema validation を受ける。
- command 成功時は store UnitOfWork で Event と snapshot を保存する。
- list / detail API は DB projection reader から query DTO を取得する。

## Public API

- `build_router(app_state)`
- `AppState`
  - config
  - store
  - projection reader
  - git ops / inspect
  - verifier engine
- `AppService`
  - `create_context`
  - `approve_context`
  - `create_work_order`
  - `generate_work_contract`
  - `register_repo`
  - `create_worktree`
  - `run_verifier`
  - `accept_work_order`
  - `create_handoff`
  - `refresh_handoff_from_git_history`
- `ApiErrorMapper`

## 状態遷移 / 不変条件

- DB row を API response として直接返さない。
- command 成功時は Event link を返す。
- process 管理は Session state と同期する。
- handler は store / DB / Git / verifier の詳細型を response として返さない。
- AppService は core の domain result を store UnitOfWork で永続化する。
- `accepted` は Owox 検収完了であり、外部 merge 完了ではない。
- Handoff integrated / stale は Git 履歴 inspect の projection として更新する。

## エラー / 例外

- schema validation failure は `422`。
- state conflict は `409`。
- adapter not found は `SESSION_ADAPTER_NOT_FOUND`。
- stream disconnected は Session error event として扱う。
- domain state conflict は `409`。
- policy / contract violation は `422`。
- store lock busy は `409`。
- projection stale は `409` または stale marker 付き response。

## 横断ルール

- API typed error は UI 判定可能にする。
- long-running command は `202` と Event / Session link を返す。
- route handler は `request_id` を生成または受け取り、Event / error に接続する。
- OpenCode process 管理は v0 後半の experimental phase とし、Manual Outsource を先に成立させる。
- WebUI static build 配信は server の責務だが、WebUI build 自体は `apps/web` の責務。

## 検証観点

- API contract test。
- command endpoint が Event を発行する。
- OpenCode process failure が Session state に反映される。
- handler が DB row を直接返さない。
- AppService が core result を store UnitOfWork で保存する。
- schema invalid command が 422 になる。
- Handoff refresh が Git 履歴のみで integrated / stale を返す。

## 関連資料

- `../contracts/SPEC-api-v0-contracts.md`
- `../shared/SPEC-flow-ai-cli-session.md`
- `SPEC-crate-owox-core.md`
- `SPEC-crate-owox-store.md`
- `SPEC-crate-owox-db.md`
