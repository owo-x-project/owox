# Task 004 AppService Git Verifier Handoff

## 目的

repo / worktree / verifier / handoff API を AppService 経由で実装する。

## 前提条件

- Phase 05 完了
- Task 003 完了

## 作業内容

- repo register / worktree endpoints を実装する
- verifier run endpoint を実装する
- accept / reject / request_revision を実装する
- handoff create / refresh-from-git を実装する

## 完了条件

- accept 前に verifier report が必要
- handoff refresh が Git 履歴のみで integrated / stale を返す

## 検証方法

- `cargo test -p owox-server verifier`
- `cargo test -p owox-server handoff`

## 依存関係

- Phase 05
- Task 003

## 成果物

- git / verifier / handoff API
