---
id: REQ-workbench-review
status: 採用
related:
  - docs/project/specs/web/index.md
  - docs/project/architecture.md
---

# WebUI Workbench による確認、差分、軽微修正

## 目標

Owox Workbench は、ユーザーがブラウザから作業状況、Context、AI CLI Session、diff、Evidence を確認し、検収判断と軽微修正を行える入口を提供する。

## 根拠

Owox は本格 IDE ではないが、AI 作業の検収には diff 確認、Evidence 確認、軽微修正、accept / reject が必要である。

## 対象範囲

- MVP 画面は Home / CEO Desk、Work Orders、Context に絞る。
- ユーザーは判断待ち、高リスク変更、検収待ち、失敗 Session、Context Proposal を確認できる。
- diff viewer、簡易編集、patch apply、patch revert、Evidence 表示、accept / reject を扱う。
- Work Order と diff / Evidence を紐付けて表示する。
- WebUI は Owox 管理下の作業を確認、修正、検収する作業台として扱う。

## 対象外

- 本格 IDE。
- 高度な補完。
- LSP 統合。
- debugger。
- 本格 terminal。
- 拡張機能システム。
- リモート開発 IDE。

## 成功指標

- ユーザーが WebUI から今見るべき Work Order と判断待ちを把握できる。
- Work Order に関連する Context、AI CLI Session、diff、Evidence を辿れる。
- diff を確認し、必要な軽微修正を行える。
- Evidence と Verifier 結果を見て accept / reject できる。
- Official Context への反映が必要な場合、Context Proposal に進められる。

## 制約 / 品質条件

- UI は段階的に増やし、MVP で画面を広げすぎない。
- WebUI は検収と確認の作業台であり、外部 IDE を置き換えない。
- 重大判断は AI Agent に自動委任しない。

## 関連資料

- `../../specs/web/index.md`
- `../../architecture.md`
- `../../validation.md`
