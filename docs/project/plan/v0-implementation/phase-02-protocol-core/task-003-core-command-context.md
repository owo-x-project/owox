# Task 003 Core Command Context

## 目的

`owox-core` の command 関数に渡す外部注入 context を作る。

## 前提条件

- Task 001 完了
- `SPEC-crate-owox-core`

## 作業内容

- `CommandContext` を定義する
- actor、request_id、reason、now、ids を持たせる
- typed domain error を定義する

## 完了条件

- ID/time が core 内で生成されない
- deterministic test が書ける

## 検証方法

- `cargo test -p owox-core command_context`

## 依存関係

- Task 001

## 成果物

- core command context
