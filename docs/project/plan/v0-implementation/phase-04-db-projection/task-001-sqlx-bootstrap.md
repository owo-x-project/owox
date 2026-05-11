# Task 001 SQLx Bootstrap

## 目的

SQLite / SQLx migration の土台を作る。

## 前提条件

- Phase 00 完了
- `SPEC-crate-owox-db`

## 作業内容

- SQLite connection / migration runner を作る
- initial migration を作る
- temp DB migration test を追加する

## 完了条件

- 空 DB に migration を適用できる
- migration を複数回実行しても壊れない

## 検証方法

- `cargo test -p owox-db migration`

## 依存関係

- Phase 00

## 成果物

- SQLx bootstrap
