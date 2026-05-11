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
- v0 の変更種別 template は `code`, `docs`, `schema_contract`, `ui`, `git_handoff` の5分類から始める。
- 各 template は `diff` と `verifier_report` を必須にする。
- `code`, `ui`, `schema_contract`, `git_handoff` は関連する `test_result` または `command_log` を必須にする。
- `docs` は `review_note` を必須にする。
- required evidence の追加 / 緩和は Work Contract revision に reason と actor を残す。

## Required Evidence Template

- `code`
  - required: `diff`, `test_result`, `command_log`, `verifier_report`
  - 例: `cargo test`, `cargo check`
- `docs`
  - required: `diff`, `review_note`, `verifier_report`
  - 例: 参照した正本、更新理由、未更新範囲
- `schema_contract`
  - required: `diff`, `schema_validation`, `contract_fixture_result`, `verifier_report`
  - 例: valid / invalid fixture の schema validation
- `ui`
  - required: `diff`, `ui_check_result`, `build_log`, `verifier_report`
  - 例: `pnpm check`, `pnpm build`, 画面 fixture
- `git_handoff`
  - required: `diff`, `git_inspection_result`, `handoff_record`, `verifier_report`
  - 例: changed paths、head commit、target branch history 判定

## 状態遷移 / 不変条件

- Contract revision は過去 revision を上書きしない。
- Session は特定 Contract revision に紐付く。
- required evidence template の緩和は silent に行わない。

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
- 5分類 template が期待する Evidence kind を生成する。
- template 緩和時に reason がない場合は拒否する。

## 関連資料

- `../../requirements/v0/REQ-work-contract.md`
