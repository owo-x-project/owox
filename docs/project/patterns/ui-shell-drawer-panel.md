---
status: 採用
related:
  - docs/project/specs/owox/SPEC-ui-workspace-shell.md
  - docs/project/specs/owox/SPEC-ui-responsive-webui.md
subproject: owox
---

# Shell Drawer Panel

## 目的

workspace 内の drawer / panel / sheet の配置、開閉、focus、重なり方を統一する。

## 適用範囲

- workspace shell の左右 drawer、下 sheet、上 modal、desktop pin 固定。

## 適用しない範囲

- native OS drawer / compositor integration。
- v1 `owlcore` plugin UI 内部の独自 panel。

## パターン

- drawer / panel は一時表示を基本にする。
- desktop では必要に応じて drawer を pin 固定できる。
- mobile では drawer を sheet / full-screen surface として表示する。
- drawer / sheet は方向固定、snap point、drag close、Esc / backdrop close を持つ。
- pin 固定は desktop のみ許可する。
- 表示方向は役割で固定する。
  - 下: terminal sheet
  - 左: files sheet
  - 右: Git / review sheet
  - 上: command palette modal

## 適用条件

- active surface を保ったまま補助情報や操作を出したい場合。
- viewport 幅が足りず pane 同時表示が破綻する場合。

## 例外 / 逸脱条件

- editor は file 選択後に full-screen 表示を許す。
- desktop の review 作業では Git / diff / logs を広く使うため pin 固定を許す。
- mobile では複数 sheet の同時表示を避ける。

## 根拠

- Caelestia Shell 風の drawer / panel 操作を Web workspace に写像する。
- smartphone では navigation item 常設より、方向付き sheet のほうが terminal 表示領域を確保しやすい。

## 関連資料

- `../specs/owox/SPEC-ui-workspace-shell.md`
- `../specs/owox/SPEC-ui-responsive-webui.md`
