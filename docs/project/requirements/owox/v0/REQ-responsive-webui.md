---
id: REQ-responsive-webui
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/validation.md
---

# Responsive WebUI

## 目標

`owox` v0 は PC、tablet、smartphone の各 viewport で主要操作を完了できる responsive WebUI を提供する。

## 根拠

`owox` は 1 brand の project repo を、スマホ、タブレット、ラップトップ、デスクトップなどあらゆる device から browser 経由で開発する作業面である。

## 対象範囲

- project 一覧と workspace 切替。
- terminal session 操作。
- agent session 起動、停止、監視。
- log 確認。
- Git 操作。
- file tree。
- 簡易 editor。
- diff view。
- smartphone での drawer、tabs、sheets による表示切替。

## 対象外

- native mobile app。
- device 固有 plugin。
- desktop と完全同一の固定 pane layout。

## 成功指標

- PC、tablet、smartphone の各 viewport で主要操作を完了できる。
- UI 要素が重なったり、操作不可になったりしない。
- terminal、editor、diff の切替が小画面でも成立する。

## 制約 / 品質条件

- mobile でも full operation を目標にする。
- 小画面では同時表示より、切替による操作完了性を優先する。

## 関連資料

- `REQ-owox-product-scope.md`
- `../../../validation.md`
