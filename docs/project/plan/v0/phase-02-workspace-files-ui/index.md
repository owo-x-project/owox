# Phase 02: Workspace Files UI

## 目的

project list、workspace shell、file tree、editor、log view の基本操作を実装し、terminal / Git 実装前でも workspace 作業面として成立させる。

## 前提条件

- Phase 01 が完了し、HTTP / WebSocket / workspace boundary / DB contract が利用できる。

## 完了条件

- project 一覧から workspace を開ける。
- file tree で project repo 内 file を開ける。
- 簡易 editor で text file を表示、編集、保存できる。
- log view が command / session log contract に接続できる。
- workspace shell の主要 state が reload 後に復元される。

## 検証方法

- UI state / component unit test。
- file API route test。
- editor save の fixture test。
- workspace shell smoke。

## task 一覧

- `task-001-project-list-api-ui.md`: project discovery API と project list UI を実装する。
- `task-002-workspace-shell-layout.md`: workspace shell と state restore を実装する。
- `task-003-file-tree-api-ui.md`: file tree API と UI を実装する。
- `task-004-editor-api-ui.md`: CodeMirror editor、read/write API、dirty state を実装する。
- `task-005-log-view-baseline.md`: log view の基本表示、filter、追尾を実装する。

## 依存関係

- `../phase-01-foundation-contracts/index.md`
- `../../../specs/owox/SPEC-ui-project-list.md`
- `../../../specs/owox/SPEC-ui-workspace-shell.md`
- `../../../specs/owox/SPEC-ui-file-tree.md`
- `../../../specs/owox/SPEC-ui-editor.md`
- `../../../specs/owox/SPEC-ui-log-view.md`
