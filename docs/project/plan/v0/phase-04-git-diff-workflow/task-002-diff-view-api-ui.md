# Task 002: Diff View API UI

## 目的

file diff を取得し、workspace 内で readable に表示する diff view を実装する。

## 前提条件

- Git status service と file tree がある。

## 作業内容

- git diff API と parser を実装する。
- unified / side-by-side 表示方針に従った diff view UI を実装する。
- file tree / Git status / editor から diff view を開けるようにする。

## 完了条件

- changed file の diff が表示される。
- binary / deleted / renamed file の表示が仕様どおりになる。
- diff parse failure が error display に出る。

## 検証方法

- diff parser fixture test。
- diff view component unit test。
- binary / rename fixture test。

## 依存関係

- `task-001-git-service-status-branches.md`
- `../phase-02-workspace-files-ui/task-003-file-tree-api-ui.md`
- `../../../specs/owox/SPEC-ui-diff-view.md`

## 成果物

- diff API。
- diff view UI。
