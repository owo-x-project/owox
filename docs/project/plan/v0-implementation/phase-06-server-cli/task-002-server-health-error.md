# Task 002 Server Health Error

## 目的

axum router、health endpoint、typed error response を実装する。

## 前提条件

- Task 001 完了
- `SPEC-crate-owox-server`

## 作業内容

- `build_router` を実装する
- `GET /api/v1/health` を実装する
- API typed error mapper を実装する

## 完了条件

- health が 200 を返す
- 404 / validation error が typed error になる

## 検証方法

- `cargo test -p owox-server health`
- `cargo test -p owox-server error`

## 依存関係

- Task 001

## 成果物

- server base
