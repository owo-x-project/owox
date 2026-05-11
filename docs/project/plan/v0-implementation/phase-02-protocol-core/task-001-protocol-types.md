# Task 001 Protocol Types

## 目的

JSON Schema / OpenAPI に対応する `owox-protocol` 型を実装する。

## 前提条件

- Phase 01 完了
- `SPEC-crate-owox-protocol`

## 作業内容

- `common`, `context`, `work`, `session`, `evidence`, `event`, `policy`, `api`, `stream` module を作る
- schema enum と Rust enum を一致させる
- fixture parse tests を追加する

## 完了条件

- valid fixture を parse できる
- enum 不一致 fixture が失敗する

## 検証方法

- `cargo test -p owox-protocol`

## 依存関係

- Phase 01

## 成果物

- protocol Rust types
