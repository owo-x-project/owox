---
id: REQ-git-workflow
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/validation.md
---

# Git Workflow

## 目標

`owox` v0 は VS Code 標準 Source Control 相当の Git 操作を WebUI から提供する。

## 根拠

AI 駆動開発では、terminal output と Git change を同じ workspace 内で確認し、必要な差分操作をすぐ実行できることが重要である。

## 対象範囲

- status 表示。
- file diff 表示。
- stage / unstage。
- discard。
- commit。
- branch checkout / create。
- fetch / pull / push / sync。
- Git command の成功、失敗、conflict、認証失敗の表示。

## 対象外

- Git hosting の再実装。
- GitHub PR / issue 連携。
- CI/CD 管理。
- 複雑な merge conflict editor。

## 成功指標

- ユーザーが WebUI から主要 Git 操作を完了できる。
- remote 操作失敗時に原因が log / UI で追える。
- 破壊的操作は明示確認を経る。

## 制約 / 品質条件

- Git 操作は project repo boundary 内で実行する。
- secret 本体を docs、log、`.owox/owlcore/` に保存しない。

## 関連資料

- `REQ-owox-product-scope.md`
- `../../../validation.md`
