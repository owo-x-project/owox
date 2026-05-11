---
id: REQ-workbench-surface-expansion
status: 提案中
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-workbench-review.md
  - docs/project/specs/web/index.md
---

# Workbench 画面と確認面の拡張

## 目標

Owox v1 は、v0 の Home / CEO Desk、Work Orders、Context を拡張し、作業、証拠、repo、policy、event を横断確認できる画面を提供する。

## 根拠

v0 は UI を最小画面に絞る。v1 では AI CLI Session、Evidence、Task Graph、Repo、Policy、Event Log が増えるため、確認面を分離して操作しやすくする必要がある。

## 対象範囲

- Company Dashboard を扱う。
- Reception を扱う。
- Task Graph 画面を扱う。
- Context Explorer を扱う。
- AI CLI Sessions 画面を扱う。
- Evidence / Verifier 画面を扱う。
- Repo / Diff Viewer と Artifact Viewer を扱う。
- Event Log、Policy View、Settings を扱う。

## 対象外

- 本格 IDE。
- 高度な補完、LSP、debugger、本格 terminal。
- リモート開発 IDE。
- UI から重大判断を AI Agent に自動委任すること。

## 成功指標

- ユーザーが Work Order、Session、Evidence、Verifier、Event を相互に辿れる。
- 判断待ち、失敗 Session、高リスク変更、Context Proposal を個別画面で確認できる。
- Policy と Event Log の根拠を検収判断時に確認できる。
- 画面増加後も v0 の主要フローが迷わず実行できる。

## 制約 / 品質条件

- Workbench は外部 IDE を置き換えない。
- 画面追加は検収、判断、監査に必要な単位で段階的に行う。
- 情報表示と正式変更の操作権限を分ける。

## 関連資料

- `../v0/REQ-workbench-review.md`
- `../../specs/web/index.md`
- `../../validation.md`
