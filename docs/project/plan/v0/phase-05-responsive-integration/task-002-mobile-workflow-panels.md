# Task 002: Mobile Workflow Panels

## 目的

smartphone で主要操作を drawer、tabs、sheets による切替で完了できるようにする。

## 前提条件

- responsive shell layout がある。

## 作業内容

- mobile bottom shell / tabs を実装する。
- file tree、terminal list、Source Control、log、command launcher を sheet / drawer に割り当てる。
- keyboard / viewport resize 時の terminal input と editor save 操作を調整する。

## 完了条件

- smartphone viewport で project 選択、terminal 起動、log 確認、Git status、file edit、diff 確認ができる。
- keyboard 表示時に主要 action が隠れない。
- desktop と同等の主要操作導線がある。

## 検証方法

- mobile panel reducer unit test。
- smartphone viewport browser smoke。

## 依存関係

- `task-001-responsive-shell.md`
- `../../../patterns/ux-mobile-bottom-shell.md`

## 成果物

- mobile panel navigation。
- drawer / sheet integration。
