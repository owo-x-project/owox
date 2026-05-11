---
id: SPEC-crate-owox-db
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/specs/shared/SPEC-data-owox-layout.md
  - docs/project/specs/crates/SPEC-crate-owox-store.md
subproject: crates
---

# owox-db

## 概要

`owox-db` は SQLite projection / cache / index を扱う crate。DB は正本ではなく、`.owox/` から再構築可能にする。

## 関連要求

- `REQ-product-mvp-scope`
- `REQ-repo-worktree-isolation`

## 入力

- `owox-store` rebuild stream
- Event Envelope
- entity snapshot

## 出力

- query model
- list / filter 用 index
- migration result

## 挙動

- SQLx migration を持つ。
- DB row 型を crate 外へ漏らさない。
- API response は protocol / projection DTO へ変換できる query DTO として返す。
- public API は ProjectionReader と rebuild を中心にする。
- write は `rebuild_from_store` と projection apply に限定する。
- rebuild は v0 では既存 DB を破棄して `.owox/` から再生成する。
- server は `list_*` / `get_*` query DTO だけ使う。
- DB row 型、SQLx query result、connection pool は crate 外へ漏らさない。

## Public API

- `OwoxDb::connect(path)`
- `OwoxDb::migrate()`
- `OwoxDb::rebuild_from_store(rebuild_stream)`
- `ProjectionReader::list_contexts(filter, cursor)`
- `ProjectionReader::get_context(context_id)`
- `ProjectionReader::list_work_orders(filter, cursor)`
- `ProjectionReader::get_work_order(work_order_id)`
- `ProjectionReader::list_sessions(filter, cursor)`
- `ProjectionReader::list_evidence(filter, cursor)`
- `ProjectionReader::list_events(filter, cursor)`
- `ProjectionReader::list_handoffs(filter, cursor)`

## 状態遷移 / 不変条件

- DB は source of truth にならない。
- migration は schema_version と互換性を確認する。
- DB に対する create / update API は v0 では提供しない。
- `.owox/` 正本から DB を破棄再生成できる。
- raw secret payload は DB に保存しない。
- large body は一覧 projection に含めない。

## エラー / 例外

- migration failure は `DB_MIGRATION_FAILED`。
- rebuild mismatch は `DB_REBUILD_MISMATCH`。
- query invalid は `DB_QUERY_INVALID`。
- unsupported projection schema は `DB_SCHEMA_UNSUPPORTED`。
- stale projection は `DB_PROJECTION_STALE`。

## 横断ルール

- projection は一覧 API の性能最適化に使う。
- raw secret payload は DB に保存しない。
- `owox-db` は `owox-store` rebuild stream を入力として扱う。
- `owox-db` は `owox-git`、`owox-server` に依存しない。
- cursor pagination は stable order を持つ。

## 検証観点

- empty DB から rebuild できる。
- snapshot / Event fixture と query result が一致する。
- rebuild 前後で list / get query result が一致する。
- raw secret payload が projection に保存されない。
- HandoffRecord の integrated / stale projection を query できる。

## 関連資料

- `../shared/SPEC-data-owox-layout.md`
- `../../architecture.md`
- `SPEC-crate-owox-store.md`
