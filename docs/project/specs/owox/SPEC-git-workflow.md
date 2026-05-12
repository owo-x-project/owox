---
id: SPEC-git-workflow
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-git-workflow.md
subproject: owox
---

# Git Workflow

## 概要

VS Code 標準 Source Control 相当の Git 操作の仕様。

## 関連要求

- `REQ-git-workflow`

## 入力

- selected project
- Git operation request
- file path list
- commit message
- branch name
- remote operation request
- destructive confirmation token

## 出力

- Git status
- Git diff summary
- operation result
- conflict / auth / command error
- updated working tree state

## 挙動

- v0 は status、diff、stage、unstage、discard、commit、branch checkout / create、fetch、pull、push、sync を扱う。
- Git command は selected project repo boundary 内で実行する。
- Git operation の stdout / stderr / exit status は operation log に残す。
- remote 操作失敗時は認証失敗、network failure、conflict などを UI と log で追えるようにする。
- discard、delete、overwrite、dirty tree を伴う branch checkout など破壊的操作は強確認を必須とする。

## 状態遷移 / 不変条件

- Git operation は selected project に属する。
- write operation 完了後、status と diff を再取得する。
- commit は staged changes と commit message を必要とする。
- remote operation は Git hosting / CI/CD 管理を行わない。

## エラー / 例外

- conflict、auth failure、network failure、command not found、not a git repo、dirty tree は区別して表示する。
- destructive confirmation が未完了の場合、破壊的操作は実行しない。

## 横断ルール

- workspace boundary は `SPEC-shared-workspace-boundary.md` に従う。
- command execution は `SPEC-shared-command-execution.md` に従う。
- destructive confirmation は `SPEC-shared-destructive-confirmation.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- status、diff、stage、unstage、discard、commit、branch checkout / create、fetch、pull、push、sync を WebUI から実行できる。
- remote 認証失敗と conflict が UI / log で追える。
- 破壊的操作は強確認なしに実行されない。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-git-workflow.md`
