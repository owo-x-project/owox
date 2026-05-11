---
id: SPEC-crate-owox-store
status: 採用
related:
  - docs/project/specs/shared/SPEC-data-owox-layout.md
  - docs/project/specs/shared/SPEC-data-event-log.md
  - docs/project/specs/crates/SPEC-crate-owox-protocol.md
subproject: crates
---

# owox-store

## 概要

`owox-store` は `.owox/` 正本 file、append-only Event、entity snapshot、projection rebuild input を扱う crate。

## 関連要求

- `REQ-repo-worktree-isolation`
- `REQ-policy-event-audit`

## 入力

- domain command result
- validated entity snapshot
- validated Event Envelope
- command transaction metadata

## 出力

- `.owox/` file update
- append-only JSONL Event
- entity snapshot update
- index update
- rebuild stream

## 挙動

- `.owox/` layout を `SPEC-data-owox-layout` に従って読み書きする。
- command transaction は lock 取得、schema validation、Event 追記、snapshot / index atomic replace をまとめて扱う。
- lock は advisory lock とし、Git 管理外に置く。
- schema validation は write 前に実行する。
- public API は UnitOfWork とする。
- `begin_command` で lock を取得する。
- `put_snapshot` は entity snapshot を staged write として保持する。
- `append_event` は Event JSONL record を staged append として保持する。
- `commit` は Event append、snapshot replace、index replace を実行する。
- commit 失敗時は command 全体を失敗として扱う。
- rebuild stream は `.owox/manifest.json`、index、snapshot、events を読み、projection 用 record を順序付きで返す。

## Public API

- `OwoxStore::open(root)`
- `OwoxStore::begin_command(command_id, actor, reason)`
- `CommandUnitOfWork::put_snapshot(entity_kind, entity_id, Validated<T>)`
- `CommandUnitOfWork::append_event(Validated<EventEnvelope>)`
- `CommandUnitOfWork::commit()`
- `CommandUnitOfWork::rollback()`
- `OwoxStore::read_snapshot(entity_kind, entity_id)`
- `OwoxStore::list_index(entity_kind, filter)`
- `OwoxStore::rebuild_stream()`
- `OwoxStore::validate_layout()`

## 状態遷移 / 不変条件

- Event は上書きしない。
- snapshot は最新 entity state。
- DB へ直接依存しない。
- UnitOfWork なしの write API は提供しない。
- `.owox/locks/`、一時 file、SQLite DB は Git 管理しない。
- `HandoffRecord` は `.owox/handoffs/<handoff_id>.json` に保存する。

## エラー / 例外

- lock busy は `STORE_LOCK_BUSY`。
- schema invalid は `STORE_SCHEMA_INVALID`。
- Event / snapshot 不整合は `STORE_INTEGRITY_MISMATCH`。
- commit 中の partial write は `STORE_TRANSACTION_FAILED`。
- missing manifest は `STORE_MANIFEST_MISSING`。
- unsupported schema_version は `STORE_SCHEMA_VERSION_UNSUPPORTED`。

## 横断ルール

- Git diff で review 可能な JSON を出力する。
- projection rebuild は store の読み出し API から始める。
- `owox-store` は `owox-protocol` に依存できる。
- `owox-store` は `owox-db`、`owox-server` に依存しない。
- JSON は stable key order で出力する。

## 検証観点

- Event append と snapshot update の整合。
- fresh clone から rebuild stream を生成できる。
- UnitOfWork commit 失敗時に不整合 snapshot が残らない。
- schema invalid payload が write 前に拒否される。
- `HandoffRecord` snapshot が読み書きできる。

## 関連資料

- `../shared/SPEC-data-owox-layout.md`
- `../shared/SPEC-data-event-log.md`
- `SPEC-crate-owox-protocol.md`
