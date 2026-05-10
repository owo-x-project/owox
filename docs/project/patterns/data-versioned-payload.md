---
status: 採用
related:
  - docs/project/specs/contracts/SPEC-api-v0-contracts.md
---

# Versioned Payload

## 目的

永続 payload の schema 進化を API version と分けて扱う。

## 適用範囲

- entity JSON
- Event JSONL
- Work Contract
- Evidence
- Context Capsule

## 適用しない範囲

- 一時 UI state
- 再生成できる projection row

## パターン

永続 payload は `schema_version` を必須 field とする。

## 適用条件

- `.owox/` に保存する。
- 外部契約として export / import する。

## 例外 / 逸脱条件

- API endpoint version は `/api/v1` で表すが、payload schema_version の代替にしない。

## 根拠

file 正本は API lifecycle と独立して migration が必要になる。

## 関連資料

- `../specs/contracts/SPEC-api-v0-contracts.md`
