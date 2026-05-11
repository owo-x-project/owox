# Task 002 Git Inspect Handoff

## 目的

changed paths / diff / Git 履歴判定を実装する。

## 前提条件

- Task 001 完了

## 作業内容

- `GitInspect::changed_paths` を実装する
- `GitInspect::diff` を実装する
- `is_ancestor` と `handoff_integration_status` を実装する

## 完了条件

- changed paths と unified diff を取得できる
- head commit が target branch history に含まれる場合 integrated と判定できる
- 含まれない場合 stale と判定できる

## 検証方法

- `cargo test -p owox-git inspect`
- `cargo test -p owox-git handoff`

## 依存関係

- Task 001

## 成果物

- GitInspect
