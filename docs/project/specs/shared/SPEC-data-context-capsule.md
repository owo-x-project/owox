---
id: SPEC-data-context-capsule
status: 採用
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-context-governance.md
  - docs/project/specs/shared/SPEC-state-context-governance.md
---

# Context Capsule

## 概要

Context Capsule は AI CLI / Agent に渡す必要最小文脈の snapshot。

## 関連要求

- `REQ-context-governance`
- `REQ-ai-cli-outsourcing`

## 入力

- Active Context 参照集合
- Work Contract
- constraints
- forbidden context rule

## 出力

- Context Capsule payload
- export 用 prompt section

## 挙動

- Capsule は `active_decisions`, `constraints`, `references`, `deprecated`, `forbidden_context` を持つ。
- `forbidden_context` は本文を含めず、含めてはいけない分類、path、理由を表す。
- Capsule は生成時点の snapshot とし、Session に渡した後は Work Contract revision と紐付ける。

## 状態遷移 / 不変条件

- Capsule は Official / Active Context から生成する。
- Rejected / secret / forbidden context は Capsule 本体に含めない。

## エラー / 例外

- forbidden context を本文に含む Capsule 生成は reject。
- 参照先 Context が Deprecated / Rejected の場合は生成失敗。

## 横断ルール

- Capsule payload は `schema_version` 必須。
- Manual Outsource と OpenCode Adapter は同じ Capsule payload を使う。

## 検証観点

- 必要 section が欠落した Capsule を検出できる。
- secret path 由来情報が含まれない。

## 関連資料

- `SPEC-state-context-governance.md`
