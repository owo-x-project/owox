# Task 002: SQLite Managed Metadata

## 目的

project、session、log、UI state を管理する SQLite metadata 境界を作る。

## 前提条件

- app scaffold が存在する。
- `ADR-0004-sqlite-managed-state.md` を正本とする。

## 作業内容

- sqlx migration と database initialization を追加する。
- project metadata、terminal session metadata、log metadata、UI state の repository を分ける。
- project repo 内に control plane 正本を作らない制約を test に落とす。

## 完了条件

- DB 初期化と migration が冪等に動く。
- repository unit test が通る。
- metadata 保存先が workspace root / project repo と分離している。

## 検証方法

- SQLite in-memory または temp file unit test。
- migration test。

## 依存関係

- `task-001-app-scaffold.md`
- `../../../adr/active/ADR-0004-sqlite-managed-state.md`
- `../../../patterns/data-sqlite-managed-metadata.md`

## 成果物

- SQLite schema。
- repository 実装。
- metadata test。
