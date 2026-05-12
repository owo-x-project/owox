---
id: SPEC-ui-file-tree
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
  - docs/project/requirements/owox/v0/REQ-responsive-webui.md
subproject: owox
---

# File Tree

## 概要

project repo の簡易 file tree 表示と選択の仕様。

## 関連要求

- `REQ-terminal-workspace`
- `REQ-responsive-webui`

## 入力

- selected project
- repo-relative path
- file operation request

## 出力

- directory tree
- selected file path
- file operation result
- file operation error

## 挙動

- file tree は selected project repo 内だけを表示する。
- repo boundary 外の path は表示しない。
- file tree は file / directory の create、rename、delete を扱う。
- file selection は editor full-screen または editor surface を開く。

## 状態遷移 / 不変条件

- file tree の path は常に repo-relative path とする。
- repo boundary 外 path は API 呼び出し時点で拒否する。
- file operation 後、tree は対象 directory を再取得する。

## エラー / 例外

- boundary 外 path は拒否する。
- permission error、not found、conflict は error display に渡す。
- binary file は editor では開かず、file tree 上で種別表示する。

## 横断ルール

- workspace boundary は `SPEC-shared-workspace-boundary.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- repo 内 path だけ表示される。
- create / rename / delete が repo boundary を越えない。
- file selection から editor を開ける。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
- `../../requirements/owox/v0/REQ-responsive-webui.md`
