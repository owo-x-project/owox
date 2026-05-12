---
id: SPEC-ui-workspace-shell
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
subproject: owox
---

# Workspace Shell

## 概要

`owox` v0 の workspace 全体 shell の仕様。

## 関連要求

- `REQ-owox-product-scope`
- `REQ-terminal-workspace`

## 入力

- selected project
- active surface selection
- drawer / panel open state
- command launcher invocation

## 出力

- top status bar
- left / right drawer
- central active surface
- transient bottom panel
- command launcher

## 挙動

- desktop / tablet は top status bar、左右 drawers、中央 active surface、下部 transient panel を基本構成にする。
- active surface は `terminal`、`files`、`review` の 3 面を切り替える。
- `files` surface は file tree と editor を扱う。
- `review` surface は Git、diff、logs を扱う。
- command launcher は v0 必須の操作入口とする。
- command launcher は workspace 操作、terminal 作成、Git 操作、plugin command contribution を起動できる。

## 状態遷移 / 不変条件

- workspace shell は常に 1 つの selected project に紐づく。
- active surface は同時に 1 つを主表示する。
- drawer / panel は active surface を失わずに一時表示できる。
- command launcher は workspace boundary を越える操作を直接実行しない。

## エラー / 例外

- selected project が存在しない場合は project list / project unavailable error を表示する。
- active surface の load に失敗した場合、shell は壊さず対象 surface に error state を表示する。
- command launcher の command load に失敗した場合、launcher 内に error state と log ref を表示する。

## 横断ルール

- workspace boundary は `SPEC-shared-workspace-boundary.md` に従う。
- command execution は `SPEC-shared-command-execution.md` に従う。
- responsive 挙動は `SPEC-ui-responsive-webui.md` に従う。
- shell UI pattern は `../../patterns/ui-workspace-shell.md` に従う。

## 検証観点

- desktop / tablet で top status bar、drawers、active surface、transient panel が重ならない。
- `terminal`、`files`、`review` の 3 面を切り替えられる。
- command launcher から terminal 作成と Git 操作へ到達できる。
- plugin command contribution の表示枠が v0 UI を不安定化しない。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-owox-product-scope.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
