# Task 003 AppService Context Work

## 目的

Context / Work Order / Work Contract API を AppService 経由で実装する。

## 前提条件

- Phase 02
- Phase 03
- Phase 04
- Task 002

## 作業内容

- context command endpoints を実装する
- work order command endpoints を実装する
- contract generate endpoint を実装する
- list / get resource endpoints を実装する

## 完了条件

- command 成功時に Event と snapshot が保存される
- list / get は projection reader を使う

## 検証方法

- `cargo test -p owox-server context`
- `cargo test -p owox-server work`

## 依存関係

- Phase 02-04
- Task 002

## 成果物

- context / work API
