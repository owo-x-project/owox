---
id: SPEC-flow-evidence-acceptance
status: 採用
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-evidence-verification.md
---

# Evidence Verification Acceptance

## 概要

Done は Claim + Evidence + Verification + human Acceptance で判定する。

## 関連要求

- `REQ-evidence-verification`

## 入力

- Claim
- Work Contract required evidence
- Evidence
- changed paths / diff
- policy result

## 出力

- Verifier result
- Acceptance result
- Event

## 挙動

- Evidence は typed record。`diff`, `test_result`, `screenshot`, `command_log`, `artifact`, `review_note`, `scope_check`, `policy_result`, `verifier_report`, `schema_validation`, `contract_fixture_result`, `ui_check_result`, `git_inspection_result`, `handoff_record` を区別する。
- Verifier は `diff_scope`, `required_evidence`, `test_result`, `forbidden_path`, `human_review` の check result を返す。
- Acceptance は `submitted`, `verified`, `accepted`, `rejected`, `needs_revision` を扱う。
- Verifier pass 後も human accept が必要。
- reject / needs_revision は理由必須。
- Required evidence は Work Contract の変更種別 template に基づく。
- Evidence fixture は `contracts/fixtures/v0/{valid,invalid}/` を正本配置にする。
- `examples/` は人間向けサンプルであり、contract fixture の正本ではない。

## 状態遷移 / 不変条件

- required evidence 不足時は `accepted` 不可。
- forbidden path 変更は reject。
- human review required の変更は自動 accept 不可。
- `verifier_report` 不足時は `accepted` 不可。
- `git_handoff` template では `handoff_record` と `git_inspection_result` 不足時に accept 不可。

## エラー / 例外

- Evidence type と payload が一致しない場合は invalid evidence。
- diff_scope_check 未実施の場合は accept command を拒否する。

## 横断ルール

- Acceptance 結果は Event Log に記録する。
- Evidence payload は `schema_version` 必須。
- `owox-testkit` は `contracts/fixtures/v0/` の fixture を読む。
- fixture と JSON Schema / OpenAPI component の差分は contract test で検出する。

## 検証観点

- Evidence 不足が検出される。
- scope 外 diff が reject または review required になる。
- Acceptance 理由が Event に残る。
- 5分類 template ごとの missing evidence fixture がある。
- valid / invalid fixture が schema validation で期待通り pass / fail する。

## 関連資料

- `../../requirements/archive/legacy-control-plane/v0/REQ-evidence-verification.md`
