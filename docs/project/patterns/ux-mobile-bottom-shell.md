---
status: 採用
related:
  - docs/project/specs/owox/SPEC-ui-responsive-webui.md
subproject: owox
---

# Mobile Sheet Shell

## 目的

smartphone で方向付き sheets、command palette modal、full-screen editor を使い、主要操作を完了可能にする。

## 適用範囲

- smartphone viewport の workspace shell。
- terminal、files、Git / review、command palette、editor。

## 適用しない範囲

- bottom navigation item の常設。
- desktop / tablet の pinned drawer layout。

## パターン

- default surface は terminal とする。
- bottom navigation は置かない。
- terminal は下から sheet として呼び出せる。
- files は左から sheet として呼び出せる。
- Git / review は右から sheet として呼び出せる。
- command palette は上から modal として呼び出せる。
- file 選択後、editor は full-screen 表示する。

## 適用条件

- smartphone で主要操作を完了する場合。
- terminal の表示領域と入力操作を優先する場合。

## 例外 / 逸脱条件

- 横向き tablet 相当幅では desktop / tablet shell に切り替えてよい。

## 根拠

- mobile では常設 navigation より sheet 方式のほうが作業面を広く保てる。
- `owox` v0 は mobile でも full operation を目標にする。

## 関連資料

- `../specs/owox/SPEC-ui-responsive-webui.md`
