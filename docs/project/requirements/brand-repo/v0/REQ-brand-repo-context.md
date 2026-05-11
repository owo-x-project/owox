---
id: REQ-brand-repo-context
status: 提案中
related:
  - docs/project/adr/active/ADR-0003-owox-owlcore-product-split.md
  - docs/project/requirements/owlcore/v1/REQ-owlcore-product-scope.md
---

# Brand Repo and Brand Context

## 目標

brand repo はブランド固有 context を Git repo として管理し、project repo 作業時に必要な brand context を使えるようにする。

## 根拠

会社・ブランド思想は継続する。ただし v1 の `owlcore` project repo 管理に混ぜると scope が肥大化するため、v2 以降の拡張として分ける。

## 対象範囲

- brand repo にブランド固有 context を保存する。
- project repo 作業時に brand context を参照できる。
- `owox` が project workspace と brand context の接続 orchestration を扱う。
- brand repo を別公式 plugin にするか、`owlcore` を拡張するかを検討する。

## 対象外

- v0 `owox` 本体。
- v1 `owlcore` project repo 管理の中核。
- company-wide ERP / CRM / deployment 管理。

## 成功指標

- brand context と project context の責務差分が明確である。
- project repo 作業時に、どの brand context を使ったか追跡できる。
- brand repo 実装方針を別 plugin か `owlcore` 拡張かで判断できる。

## 制約 / 品質条件

- brand context は project repo の正本を勝手に変更しない。
- brand repo は v2 以降の拡張として扱う。

## 関連資料

- `../../owlcore/v1/REQ-owlcore-product-scope.md`
- `../../../architecture.md`
