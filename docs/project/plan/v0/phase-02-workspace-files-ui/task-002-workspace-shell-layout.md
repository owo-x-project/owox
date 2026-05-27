# Task 002: Workspace Shell Layout

## 目的

workspace 全体の navigation、panes、active project state、reload 復元を実装する。

## 前提条件

- project list から workspace を開ける。

## 作業内容

- workspace shell layout を実装する。
- active project、active file、active panel、UI state persistence を接続する。
- command launcher 入口と panel 切替の基本を追加する。

## 完了条件

- workspace shell が project context を保持する。
- reload 後に選択 project と主要 panel が復元される。
- responsive 実装前でも desktop 基本操作が成立する。

## 検証方法

- UI state reducer unit test。
- shell component unit test。
- reload restore smoke。

## 依存関係

- `task-001-project-list-api-ui.md`
- `../../../specs/owox/SPEC-ui-workspace-shell.md`
- `../../../patterns/ui-workspace-shell.md`
- `../../../patterns/ux-command-launcher.md`

## 成果物

- workspace shell。
- UI state persistence。
