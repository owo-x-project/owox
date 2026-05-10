---
status: 採用
related:
  - docs/project/adr/active/ADR-0002-repo-backed-owox-store.md
  - docs/project/specs/shared/SPEC-flow-repo-worktree.md
---

# Repo Backed Entity Store

## 目的

project 由来データを Git で review、diff、rollback できる正本として扱う。

## 適用範囲

- Context
- Work Order / Task
- Work Contract
- Session
- Evidence
- Event
- Policy

## 適用しない範囲

- 再構築可能な UI projection
- 一時 cache
- 外部 AI CLI の内部状態

## パターン

正本は project repo 内 `.owox/` の JSONL / JSON。SQLite は projection/cache/index に限定する。

## 適用条件

- Git 管理できる project 由来データ。
- 後から監査、review、diff が必要なデータ。

## 例外 / 逸脱条件

- 高速検索や一覧は SQLite projection を使ってよい。
- DB だけにしか存在しない project 由来正本を作らない。

## 根拠

Owox の検収、監査、Context 管理は Git の review / diff と相性が良い。

## 関連資料

- `../adr/active/ADR-0002-repo-backed-owox-store.md`
