---
id: SPEC-data-event-log
status: 採用
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-policy-event-audit.md
  - docs/project/adr/active/ADR-0002-repo-backed-owox-store.md
---

# Event Log

## 概要

Event Log は監査記録。debug log ではなく、判断理由と結果を追跡する正本。

## 関連要求

- `REQ-policy-event-audit`

## 入力

- command
- actor
- subject
- reason
- inputs
- result
- related entity links

## 出力

- append-only Event JSONL record

## 挙動

- Event Envelope は `id`, `schema_version`, `type`, `actor`, `occurred_at`, `subject`, `reason`, `inputs`, `result`, `links` を持つ。
- Event は `.owox/events/` に JSONL append-only record として保存する。
- 既存 Event は変更しない。
- 誤記や補正は correction Event を追加する。

## 状態遷移 / 不変条件

- Event ID は prefix + ULID。
- Event の削除や上書きは通常操作として提供しない。

## エラー / 例外

- schema_version なし Event は invalid。
- subject なしの重要 command Event は invalid。

## 横断ルール

- 重要 command は Event を発行する。
- Event から Contract、Context、Evidence、Policy result を辿れる。

## 検証観点

- correction Event が元 Event を参照する。
- Event JSONL から projection を再構築できる。

## 関連資料

- `../../requirements/archive/legacy-control-plane/v0/REQ-policy-event-audit.md`
- `../../adr/active/ADR-0002-repo-backed-owox-store.md`
