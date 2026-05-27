# Task 001: Responsive Shell

## 目的

desktop / tablet / mobile で workspace shell の基本 layout を成立させる。

## 前提条件

- workspace shell、terminal、Git、file/editor/diff panel が存在する。

## 作業内容

- breakpoint と layout state を定義する。
- desktop pane、tablet split / drawer、mobile single focus layout を実装する。
- stable dimensions と overflow handling を整える。

## 完了条件

- 各 viewport で primary navigation と active panel が操作できる。
- UI 要素の重なりや操作不可領域がない。
- terminal / editor / diff が表示領域に収まる。

## 検証方法

- layout unit test。
- viewport screenshot / browser smoke。

## 依存関係

- `../phase-02-workspace-files-ui/task-002-workspace-shell-layout.md`
- `../../../specs/owox/SPEC-ui-responsive-webui.md`

## 成果物

- responsive shell layout。
- breakpoint state。
