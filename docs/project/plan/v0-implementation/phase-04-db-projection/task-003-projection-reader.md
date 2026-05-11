# Task 003 Projection Reader

## 目的

server が使う list / get query DTO を提供する。

## 前提条件

- Task 002 完了

## 作業内容

- `ProjectionReader` を実装する
- contexts / work orders / sessions / evidence / events / handoffs の list / get を追加する
- cursor pagination を実装する

## 完了条件

- DB row 型が crate 外へ出ない
- stable order で pagination できる

## 検証方法

- `cargo test -p owox-db query`

## 依存関係

- Task 002

## 成果物

- projection reader
