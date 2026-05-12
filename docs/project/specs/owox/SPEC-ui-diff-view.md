---
id: SPEC-ui-diff-view
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
  - docs/project/requirements/owox/v0/REQ-git-workflow.md
subproject: owox
---

# Diff View

## 概要

Git change と file diff を表示する diff view の仕様。

## 関連要求

- `REQ-terminal-workspace`
- `REQ-git-workflow`

## 入力

- selected project
- Git status
- selected file path
- diff mode: unstaged / staged

## 出力

- working tree diff
- staged diff
- file diff
- hunk list
- diff load error

## 挙動

- v0 diff view は working tree diff と staged diff を表示する。
- file selection に応じて file diff と hunk を表示する。
- commit range diff は v0 では扱わない。
- diff view は Git workflow の status / stage state と連動する。

## 状態遷移 / 不変条件

- diff は selected project の Git state に属する。
- stage / unstage 後、working tree diff と staged diff を更新する。
- file tree / editor で対象 file が変わった場合、diff view は stale state を表示できる。

## エラー / 例外

- binary file diff は text diff として表示しない。
- large diff は summary を先に表示し、本文は手動 load にする。
- large diff の自動全文読み込みは行わない。
- Git command failure は error display に渡す。

## 横断ルール

- Git operation は `SPEC-git-workflow.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- unstaged / staged diff を切り替えられる。
- file diff と hunk が表示できる。
- stage / unstage 後に diff state が更新される。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
- `../../requirements/owox/v0/REQ-git-workflow.md`
