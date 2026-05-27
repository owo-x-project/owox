# Phase 01: Foundation Contracts

## 目的

server / client が共有する v0 contract と安全境界を固定し、後続機能を仕様どおり積める土台を作る。

## 前提条件

- `docs/project/specs/owox/SPEC-shared-http-api.md`、`SPEC-shared-websocket-events.md`、`SPEC-shared-workspace-boundary.md`、`SPEC-shared-command-execution.md` が採用済み。
- Rust / Axum / Tokio、Solid + Vite、SQLite + sqlx 採用方針が有効。

## 完了条件

- server / client scaffold、型共有方針、API error envelope、WebSocket event envelope、SQLite schema、workspace boundary、command execution result が実装済み。
- 主要 contract の unit test が通る。
- 後続 phase が mock ではなく contract 実装に接続できる。

## 検証方法

- Rust unit test / integration test。
- TypeScript typecheck / unit test。
- workspace boundary と command execution の fixture test。

## task 一覧

- `task-001-app-scaffold.md`: Rust server / Solid client / shared workspace scaffold を作る。
- `task-002-sqlite-managed-metadata.md`: SQLite managed metadata の schema と repository 境界を作る。
- `task-003-workspace-boundary.md`: workspace root / project repo boundary 検証を実装する。
- `task-004-http-api-contract.md`: HTTP API envelope、route skeleton、error mapping を実装する。
- `task-005-websocket-event-contract.md`: WebSocket event envelope、subscription skeleton、serialization test を実装する。
- `task-006-command-execution-contract.md`: command execution result、destructive confirmation 判定、secret redaction 境界を実装する。

## 依存関係

- `../index.md`
- `../../../specs/owox/SPEC-shared-http-api.md`
- `../../../specs/owox/SPEC-shared-websocket-events.md`
- `../../../specs/owox/SPEC-shared-workspace-boundary.md`
- `../../../specs/owox/SPEC-shared-command-execution.md`
- `../../../patterns/index.md`
