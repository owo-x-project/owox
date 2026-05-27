---
status: 採用
related:
  - docs/project/tech-stack.md
subproject: owox
---

# SQLite Managed Metadata

## 目的

project、session、log metadata、UI state を SQLite で扱う共通 data pattern を定義する。

## 適用範囲

- project metadata
- session metadata
- log metadata
- UI state metadata

## 適用しない範囲

- 大量 terminal output 本体。
- raw secret。
- 外部 plugin / integration の repo-native 正本。

## パターン

- SQLite は metadata と UI state を管理する。
- terminal output 本体は append log file に保持し、SQLite には path、offset、size、timestamps などの metadata を持つ。
- SQLite に raw terminal output を大量保存しない。
- migration 可能な schema を持つ。

## 適用条件

- query、一覧、状態復元が必要な管理情報。
- browser reload 後の session / UI state 再表示に必要な情報。

## 例外 / 逸脱条件

- 小さい operation event は SQLite に保持してよい。
- 大量 append が予想される data は file log へ逃がす。

## 根拠

- DB 肥大化を避けつつ、session / log の探索と復元を可能にする。

## 関連資料

- `../tech-stack.md`
