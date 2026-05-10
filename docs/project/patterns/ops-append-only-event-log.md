---
status: 採用
related:
  - docs/project/specs/shared/SPEC-data-event-log.md
---

# Append Only Event Log

## 目的

監査記録の改変を通常操作から外し、訂正も追跡できるようにする。

## 適用範囲

- `.owox/events/` の Event JSONL
- command result
- policy result
- acceptance result

## 適用しない範囲

- 再構築可能な projection
- debug log

## パターン

Event は append-only。既存 Event は変更せず、訂正は correction Event を追加する。

## 適用条件

- 後から判断理由を追跡する必要がある操作。

## 例外 / 逸脱条件

- repository 履歴の修復など管理者作業は通常 command では扱わない。

## 根拠

AI 作業の accept / reject と Official Context 変更は、判断経路の追跡が重要。

## 関連資料

- `../specs/shared/SPEC-data-event-log.md`
