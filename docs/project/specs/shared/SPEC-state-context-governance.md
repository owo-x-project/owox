---
id: SPEC-state-context-governance
status: 採用
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-context-governance.md
  - docs/project/architecture.md
---

# Context Governance State

## 概要

Context は AI や人間が作業判断に使う文脈であり、Raw から Official へ直接昇格しない。

## 関連要求

- `REQ-context-governance`

## 入力

- Raw input
- Context Proposal
- human review result
- policy check result

## 出力

- Context entity
- Context Proposal result
- Active Context 参照集合
- Event

## 挙動

- Context は `Raw`, `Proposed`, `Official`, `Deprecated`, `Rejected`, `Active Context` を扱う。
- `Active Context` は永続状態ではなく、作業に渡す Official Context の参照集合として扱う。
- Raw input は Context Proposal を経由しなければ Official にならない。
- Proposal は accept または reject の結果を持つ。
- Deprecated / Rejected は Active Context に含めない。

## 状態遷移 / 不変条件

- `Raw -> Proposed -> Official`
- `Proposed -> Rejected`
- `Official -> Deprecated`
- `Raw -> Official` は禁止。
- AI CLI / Agent は Official Context を直接変更できない。

## エラー / 例外

- Proposal なしの Official 化は Policy violation。
- Deprecated / Rejected を Active Context に含める要求は reject。

## 横断ルール

- Context 変更は Event Log に記録する。
- 永続 payload は `schema_version` を持つ。
- 正本は project repo 内 `.owox/contexts/` に置く。

## 検証観点

- Raw 直接昇格が拒否される。
- Rejected / Deprecated が Capsule に混入しない。
- accept / reject の Event が残る。

## 関連資料

- `../../requirements/archive/legacy-control-plane/v0/REQ-context-governance.md`
- `../../architecture.md`
