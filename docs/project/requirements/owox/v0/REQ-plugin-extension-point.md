---
id: REQ-plugin-extension-point
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/adr/active/ADR-0001-owox-owlcore-boundary.md
---

# Plugin Extension Point

## 目標

`owox` v0 は v1 `owlcore` や後続 plugin を載せるための最小 extension point を持つ。

## 根拠

`owlcore` は v1 で `owox` に接続する。ただし v0 で汎用 plugin UI 実行基盤まで作ると Terminal Workspace / Git / Editor / responsive UI の MVP が肥大化する。

## 対象範囲

- plugin manifest の基本形を予約する。
- command contribution を予約する。
- backend hook の境界を予約する。
- plugin capability / permission の考え方を残す。

## 対象外

- 汎用 plugin UI 実行基盤。
- marketplace。
- remote plugin distribution。
- plugin 署名、課金、審査。
- plugin 間依存解決。

## 成功指標

- v1 `owlcore` が接続するための manifest、command、backend hook の設計余地がある。
- v0 実装が owlcore domain を内蔵せずに済む。

## 制約 / 品質条件

- extension point は v0 の UI / runtime を不安定にしない範囲に留める。
- plugin は host capability を明示せずに filesystem、process、network、repo 正本へアクセスしない。

## 関連資料

- `REQ-owox-product-scope.md`
- `../../../architecture.md`
