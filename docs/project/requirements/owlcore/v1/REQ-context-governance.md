---
id: REQ-context-governance
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-owlcore-product-scope.md
---

# Context Capsule Governance

## 目標

`owlcore` は AI Agent や人間が作業判断に使う文脈を Context Capsule として repo 内に記録し、Work Contract と Evidence に接続する。

## 根拠

AI 駆動開発では、どの文脈を根拠に作業したかを後から確認できなければ、再現性と検収性が落ちる。

## 対象範囲

- Context Capsule の作成。
- Context Capsule と Work Order / Work Contract の関連付け。
- Context Capsule の参照元、作成者、更新時刻、状態記録。
- 不要または古い context の非推奨化。

## 対象外

- project docs の代替。
- 中央 knowledge base。
- brand-wide context 管理。

## 成功指標

- Work Contract が参照した Context Capsule を追跡できる。
- Evidence がどの context に基づく作業か追える。

## 制約 / 品質条件

- Context Capsule は secret 本体を含まない。
- Official な正本と一時 context を混同しない。

## 関連資料

- `REQ-work-contract.md`
- `REQ-evidence-verification.md`
