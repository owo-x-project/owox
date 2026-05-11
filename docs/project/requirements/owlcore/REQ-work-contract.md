---
id: REQ-work-contract
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-context-governance.md
  - docs/project/requirements/owlcore/v1/REQ-evidence-verification.md
---

# Work Order and Work Contract

## 目標

`owlcore` は project repo で行う作業意図を Work Order として管理し、AI CLI / human worker に渡せる Work Contract を生成する。

## 根拠

AI 作業で目的、変更可能範囲、禁止範囲、必要 context、期待成果物、必須 evidence、受け入れ条件が曖昧だと、検収不能になる。

## 対象範囲

- Work Order を作成する。
- Work Contract を生成する。
- objective、allowed paths、forbidden paths、Context Capsule、constraints、expected outputs、required evidence、acceptance criteria を持つ。
- Work Contract revision を immutable に扱う。
- Work Contract を AI CLI session または manual handoff に関連付ける。
- `.owox/owlcore/` に Work Order / Work Contract / Event を保存する。

## 対象外

- 完全自動 planner。
- 大規模 Task Graph engine。
- AI CLI に契約外変更を自己承認させる運用。
- `owox` の process 起動 UI。

## 成功指標

- project repo 内で Work Order と Work Contract を作成できる。
- Work Contract が Context Capsule、Evidence、Verifier 結果と紐付く。
- scope と required evidence が作業前に明示される。

## 制約 / 品質条件

- Work Contract は自然文 prompt だけに閉じない。
- scope と required evidence を省略しない。
- Contract revision は作業中に書き換えない。

## 関連資料

- `REQ-context-governance.md`
- `REQ-evidence-verification.md`
