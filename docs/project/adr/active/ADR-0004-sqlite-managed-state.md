---
id: ADR-0004
status: 採用
date: 2026-05-12
related:
  - docs/project/tech-stack.md
  - docs/project/architecture.md
  - docs/project/integrations/docker.md
---

# owox Managed SQLite State

## 判断

`owox` v0 は project、session、log metadata、UI state を SQLite + sqlx で管理する。永続化有無は Docker volume 運用に委ねる。

## 背景

`owox` v0 は browser reload 後の reconnect と log 再表示が必要だが、`owlcore` の repo-local 正本とは責務を分ける必要がある。

## 代替案

- repo 内 `.owox/owlcore/` に v0 session 状態を保存する。
- JSONL / file store のみで管理する。
- remote database を必須にする。

## 採用理由

- SQLite は single-node self-host と相性が良い。
- repo を v0 runtime state で汚さない。
- `owlcore` v1 の file-based 正本と責務を分けられる。

## 結果

- Docker volume がない場合、SQLite / log 永続化は保証しない。
- `owlcore` の正本に SQLite を使わない。
