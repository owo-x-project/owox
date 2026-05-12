---
id: SPEC-ui-responsive-webui
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-responsive-webui.md
subproject: owox
---

# Responsive WebUI

## 概要

PC / tablet / smartphone の主要操作完了と responsive navigation の仕様。

## 関連要求

- `REQ-responsive-webui`

## 入力

- viewport class: desktop / tablet / smartphone
- active surface
- sheet / drawer / modal state
- selected project
- selected file / session / Git context

## 出力

- reachable surface list
- layout state
- active sheet / drawer / modal
- full-screen editor state

## 挙動

- desktop / tablet は `SPEC-ui-workspace-shell.md` の top status + drawers 構成を使う。
- smartphone の default surface は terminal とする。
- smartphone では bottom navigation を常設しない。
- terminal は下 sheet、files は左 sheet、Git / review は右 sheet、command palette は上 modal として表示する。
- file 選択後、editor は full-screen 表示する。

## 状態遷移 / 不変条件

- viewport 変更後も selected project と active context を失わない。
- mobile sheets / modal は同時に 1 つを主表示する。
- editor full-screen から元の terminal context に戻れる。

## エラー / 例外

- viewport 切替時に現在の active context を復元できない場合は fallback surface を表示する。
- sheet / modal の同時表示 conflict は後勝ちではなく、現在の surface を閉じる確認または明示 close を要求する。
- mobile で terminal input が表示領域を圧迫する場合、terminal surface を優先して他 sheet を閉じる。

## 横断ルール

- mobile shell は `../../patterns/ux-mobile-bottom-shell.md` に従う。
- drawer / panel は `../../patterns/ui-shell-drawer-panel.md` に従う。
- visual theme は `../../patterns/ui-caelestia-inspired-theme.md` に従う。

## 検証観点

- smartphone で bottom navigation なしに terminal、files、Git / review、command palette、editor へ到達できる。
- sheet / modal / full-screen editor が互いに重なって操作不能にならない。
- terminal と editor の文字が theme によって読みにくくならない。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-responsive-webui.md`
