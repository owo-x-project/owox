---
id: REQ-brand-repo-context
status: 提案中
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
---

# Brand Repo and Brand Context

## 目標

brand-wide context を project repo 作業へ接続できるようにする。

## 根拠

`owox` は 1 brand の workspace として複数 project repo を扱う。将来、brand 全体の方針、文脈、制約を project repo 作業へ安全に渡す仕組みが必要になる。

## 対象範囲

- brand-wide context の保存場所を検討する。
- project repo 作業時に必要な brand context を参照できる。
- `owox` が project workspace と brand context の接続 orchestration を扱う。
- 別 plugin / integration として扱うかを判断する。

## 対象外

- v0 `owox` 本体。
- v0 `owox` core。
- company-wide ERP / CRM / deployment 管理。

## 成功指標

- brand context と project context の責務差分が明確である。
- project repo 作業時に、どの brand context を使ったか追跡できる。
- brand repo 実装方針を plugin / integration として判断できる。

## 制約 / 品質条件

- brand context は project repo の正本を勝手に変更しない。
- brand repo は v2 以降の拡張として扱う。

## 関連資料

- `../../../architecture.md`
