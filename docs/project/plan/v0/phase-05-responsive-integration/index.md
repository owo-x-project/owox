# Phase 05: Responsive Integration

## 目的

PC / tablet / smartphone で主要操作を完了できる responsive WebUI と横断 UX を完成させる。

## 前提条件

- Phase 02-04 の主要 workspace 機能が実装済み。

## 完了条件

- project list、terminal、log、Git、file tree、editor、diff が viewport 別に操作できる。
- smartphone は drawer、tabs、sheets による切替で操作不可領域を作らない。
- error display と destructive confirmation が全機能で一貫する。
- 主要 workflow の browser check が通る。

## 検証方法

- responsive layout component unit test。
- viewport 別 browser smoke。
- error / confirmation state unit test。

## task 一覧

- `task-001-responsive-shell.md`: desktop / tablet / mobile shell layout を実装する。
- `task-002-mobile-workflow-panels.md`: mobile drawer / tabs / sheets と主要 panel 切替を実装する。
- `task-003-error-confirmation-integration.md`: error display と destructive confirmation を横断統合する。
- `task-004-end-to-end-workflow-smoke.md`: project から terminal / file / Git までの workflow smoke を整備する。

## 依存関係

- `../phase-02-workspace-files-ui/index.md`
- `../phase-03-terminal-log-runtime/index.md`
- `../phase-04-git-diff-workflow/index.md`
- `../../../specs/owox/SPEC-ui-responsive-webui.md`
- `../../../patterns/ui-shell-drawer-panel.md`
- `../../../patterns/ux-mobile-bottom-shell.md`
