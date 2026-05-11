# Task 002 OpenCode Process

## 目的

OpenCode process の起動、stream、cancel を実験実装する。

## 前提条件

- Task 001
- worktree 作成 API

## 作業内容

- process cwd を worktree root に固定する
- stdout / stderr capture を実装する
- cancel / timeout を実装する

## 完了条件

- process exit が Session state に反映される
- stderr が diagnostic log になる

## 検証方法

- `cargo test -p owox-server session_process`

## 依存関係

- Task 001

## 成果物

- OpenCode process runner
