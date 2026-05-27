# Phase 04: Git Diff Workflow

## 目的

VS Code 標準 Source Control 相当の Git 操作と diff view を workspace に統合する。

## 前提条件

- Phase 01 の command execution / workspace boundary が完了。
- Phase 02 の workspace shell / file tree / editor が利用可能。
- Phase 03 の log view 接続が利用可能。

## 完了条件

- status、diff、stage、unstage、discard、commit、branch checkout/create、fetch、pull、push、sync が実行できる。
- Git command の成功、失敗、conflict、認証失敗が UI / log に表示される。
- 破壊的操作は明示確認を経る。
- diff view が file tree / Git status / editor と連動する。

## 検証方法

- fixture repo による Git service unit / integration test。
- diff parser / renderer unit test。
- destructive operation confirmation test。

## task 一覧

- `task-001-git-service-status-branches.md`: Git status と branch read 系 service を実装する。
- `task-002-diff-view-api-ui.md`: diff API と diff view UI を実装する。
- `task-003-git-stage-discard-commit.md`: stage / unstage / discard / commit を実装する。
- `task-004-git-branch-remote-sync.md`: branch checkout/create、fetch/pull/push/sync を実装する。
- `task-005-source-control-panel.md`: Source Control panel と workspace 統合を実装する。

## 依存関係

- `../phase-01-foundation-contracts/index.md`
- `../phase-02-workspace-files-ui/index.md`
- `../phase-03-terminal-log-runtime/index.md`
- `../../../specs/owox/SPEC-git-workflow.md`
- `../../../specs/owox/SPEC-ui-diff-view.md`
