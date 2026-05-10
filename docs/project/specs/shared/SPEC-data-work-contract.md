---
id: SPEC-data-work-contract
status: 採用
related:
  - docs/project/requirements/v0/REQ-work-contract.md
---

# Work Contract

## 概要

Work Order は作業意図、Task は実行単位、Work Contract は実行時契約。

## 関連要求

- `REQ-work-contract`

## 入力

- Work Order
- Task Graph Lite node
- Context Capsule
- allowed / forbidden paths
- required evidence template

## 出力

- immutable Work Contract revision
- execution prompt
- Event

## 挙動

- Work Order は Task Graph Lite を持つ。
- v0 の Task Graph Lite は Task node、dependency、status を持つ。
- 自動 planner、複雑な再計画、並列 orchestration は v0 対象外。
- Work Contract は `objective`, `allowed_paths`, `forbidden_paths`, `context_capsule`, `constraints`, `expected_outputs`, `required_evidence`, `acceptance_criteria` を持つ。
- Session に渡した Contract は immutable。変更時は新 revision を作る。
- required evidence は変更種別ごとの template で初期化する。

## 状態遷移 / 不変条件

- Contract revision は過去 revision を上書きしない。
- Session は特定 Contract revision に紐付く。

## エラー / 例外

- `allowed_paths` または `required_evidence` が空の Contract は ready にできない。
- forbidden path と allowed path が衝突する場合は Policy violation。

## 横断ルール

- Contract payload は `schema_version` 必須。
- Contract revision 作成は Event に記録する。

## 検証観点

- Contract revision が immutable。
- required evidence が生成される。
- forbidden path 衝突を検出できる。

## 関連資料

- `../../requirements/v0/REQ-work-contract.md`
