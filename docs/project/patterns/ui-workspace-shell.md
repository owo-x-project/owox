---
status: 採用
related:
  - docs/project/specs/owox/SPEC-ui-workspace-shell.md
  - docs/project/specs/owox/SPEC-ui-responsive-webui.md
subproject: owox
---

# Workspace Shell

## 目的

Caelestia Shell 風の workspace shell として、status、navigation、launcher、drawer、panel を統一する。

## 適用範囲

- `owox` workspace の top status bar、drawer、active surface、transient panel、command launcher。
- desktop / tablet の primary shell。

## 適用しない範囲

- native desktop shell 実装。
- OS status bar / window manager integration。
- v1 `owlcore` plugin UI の内部 layout。

## パターン

- 常設領域は top status bar に絞る。
- 主要作業面は中央 active surface として表示する。
- active surface は `terminal`、`files`、`review` の 3 面を基本にする。
- 補助操作は左右 drawer と下部 transient panel に逃がす。
- command launcher を shell 横断の操作入口にする。

## 適用条件

- 複数機能を同じ workspace 内で切り替える UI。
- 現在の project、session、Git 状態を常に参照したい UI。

## 例外 / 逸脱条件

- smartphone は `ux-mobile-bottom-shell.md` を優先する。
- 特定作業で full-screen focus が必要な場合、active surface を一時的に単独表示できる。

## 根拠

- Caelestia Shell のような desktop shell 型 UI を `owox` の Web workspace に写像する。
- v0 は本格 IDE ではなく、terminal、files、review を横断する作業面である。

## 関連資料

- `../specs/owox/SPEC-ui-workspace-shell.md`
- `../specs/owox/SPEC-ui-responsive-webui.md`
