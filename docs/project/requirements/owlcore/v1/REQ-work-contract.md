---
id: REQ-work-contract
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-owlcore-product-scope.md
---

# Work Order and Work Contract

## 目標

`owlcore` は Work Order と Work Contract により、AI CLI や人間の作業範囲、禁止事項、期待成果、受け入れ条件を明確化する。

## 根拠

AI Agent First な作業では、自然文依頼だけでは scope drift、証拠不足、検収不能が起きやすい。repo に残る契約が必要である。

## 対象範囲

- Work Order の作成。
- Work Contract の生成。
- 目的、許可パス、禁止パス、必要 Context Capsule、期待成果物、必須 Evidence、受け入れ条件の記録。
- Agent Session との関連付け。

## 対象外

- agent の高度 orchestration。
- team 権限管理。
- remote job scheduler。

## 成功指標

- 作業開始前に scope と受け入れ条件を確認できる。
- Evidence と Verifier が Work Contract に基づいて検収できる。

## 制約 / 品質条件

- Work Contract は repo-local file として review できる。
- 作業完了判定を AI CLI の自然文報告だけに依存しない。

## 関連資料

- `REQ-context-governance.md`
- `REQ-evidence-verification.md`
