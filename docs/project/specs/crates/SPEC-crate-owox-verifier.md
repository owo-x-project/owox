---
id: SPEC-crate-owox-verifier
status: 採用
related:
  - docs/project/specs/shared/SPEC-permission-policy-gate.md
  - docs/project/specs/shared/SPEC-flow-evidence-acceptance.md
  - docs/project/specs/crates/SPEC-crate-owox-protocol.md
subproject: crates
---

# owox-verifier

## 概要

`owox-verifier` は Work Contract、diff、changed paths、Evidence、Policy rule に基づき acceptance 前検査を行う crate。

## 関連要求

- `REQ-evidence-verification`
- `REQ-policy-event-audit`

## 入力

- Work Contract revision
- changed paths / diff
- Evidence list
- Policy rule catalog
- actor / reason / human gate input

## 出力

- Verifier report
- Policy violation
- Evidence completeness result

## 挙動

- `allowed_paths` / `forbidden_paths` と changed paths を照合する。
- required evidence を kind と subject で照合する。
- secret path detector を実行する。
- blocking violation を含む report は accept 不可。
- API は fixed rule catalog + trait にする。
- 外部動的 plugin は v0 対象外。
- `VerifierRule` trait は rule 単体 test と将来拡張のために使う。
- `VerifierEngine` は固定 catalog を順に実行し、`VerifierReport` を返す。

## Public API

- `VerifierInput`
  - Work Contract revision
  - changed paths
  - Evidence list
  - actor / reason
  - policy rule catalog
- `VerifierRule`
  - `code()`
  - `evaluate(input) -> RuleResult`
- `VerifierEngine::with_default_rules()`
- `VerifierEngine::run(input) -> VerifierReport`
- fixed rules
  - `DiffScopeRule`
  - `ForbiddenPathRule`
  - `RequiredEvidenceRule`
  - `SecretPathRule`
  - `HumanFinalGateRule`

## 状態遷移 / 不変条件

- UI 表示ではなく Rust 側の changed paths と Evidence を検査対象にする。
- Verifier report 自体を Evidence として保存できる。
- rule code は stable string として扱う。
- blocking violation が 1 件以上ある report は accept 不可。
- rule の有効/無効設定は v0 では提供しない。

## エラー / 例外

- contract revision 不一致は `VERIFIER_CONTRACT_REVISION_MISMATCH`。
- evidence missing は `POLICY_REQUIRED_EVIDENCE_MISSING`。
- forbidden path は `POLICY_FORBIDDEN_PATH_CHANGED`。
- rule execution failure は `VERIFIER_RULE_FAILED`。
- invalid rule catalog は `VERIFIER_RULE_CATALOG_INVALID`。

## 横断ルール

- rule code は Policy spec と同一。
- Verifier は Git / DB / HTTP に直接依存しない。
- Verifier は changed paths / diff を入力として受け取り、Git CLI を呼ばない。
- Verifier は Evidence list を入力として受け取り、DB を読まない。

## 検証観点

- rule ごとの positive / negative fixture。
- blocking violation が accept を止める。
- fixed catalog の実行順が snapshot test で安定する。
- trait 実装 rule を単体 test できる。
- secret path fixture が positive / negative を持つ。

## 関連資料

- `../shared/SPEC-permission-policy-gate.md`
- `../shared/SPEC-flow-evidence-acceptance.md`
- `SPEC-crate-owox-protocol.md`
