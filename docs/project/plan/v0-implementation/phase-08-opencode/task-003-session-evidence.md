# Task 003 Session Evidence

## 目的

Session output を Evidence と Verifier flow に接続する。

## 前提条件

- Task 002
- Phase 06 Task 004

## 作業内容

- command_log Evidence を登録する
- diff Evidence candidate を登録する
- Session result import を実装する

## 完了条件

- Session 由来 Evidence が一覧できる
- Verification を実行できる

## 検証方法

- `cargo test -p owox-server session_evidence`

## 依存関係

- Task 002
- Phase 06 Task 004

## 成果物

- session evidence integration
