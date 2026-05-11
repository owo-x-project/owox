---
id: REQ-work-contract
status: 採用
related:
  - docs/project/glossary/core.md
  - docs/project/specs/contracts/index.md
---

# Work Order / Work Contract による作業契約

## 目標

Owox は、ユーザーの作業意図を Work Order として管理し、AI CLI や人間へ渡せる実行時契約として Work Contract を生成する。

## 根拠

AI 作業では、目的、変更可能範囲、禁止範囲、必要文脈、期待成果物、必須証拠、受け入れ条件を曖昧にすると、scope 逸脱や検収不能が起きる。

## 対象範囲

- Work Order は何を実現したいか、成果物、制約、検収方法を表す。
- Work Contract は実行時の契約として AI CLI または人間へ渡す。
- Work Contract は objective、allowed paths、forbidden paths、Context Capsule、constraints、expected outputs、required evidence、acceptance criteria を持つ。
- MVP の Task は Work Order 直下の最小実行単位として扱う。
- Task Graph は将来拡張として扱い、MVP では簡易な Task / Session 構造に留める。

## 対象外

- 大規模 Task Graph Engine。
- 完全自動 planner。
- Worker が契約外の変更を自己承認する運用。
- 実装手段や具体コマンドの詳細を requirement に固定すること。

## 成功指標

- ユーザーの作業意図から Work Order を作成できる。
- Work Order から Work Contract を生成できる。
- Work Contract に allowed paths と forbidden paths が明示される。
- 必須 Evidence と acceptance criteria が作業前に定義される。
- Work Contract が後続の Session、Evidence、Verifier 結果と紐付く。

## 制約 / 品質条件

- Work Contract は AI CLI の自然文 prompt だけに閉じず、機械検査可能な contract として扱う。
- scope と required evidence を省略しない。
- Contract first の方針に従い、外部契約は実装前に固定する。

## 関連資料

- `../../glossary/core.md`
- `../../specs/contracts/index.md`
- `../../validation.md`
