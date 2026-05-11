# Task 001 Session Model

## 目的

AI CLI Session の domain / protocol / projection を実装する。

## 前提条件

- Phase 06 完了

## 作業内容

- Session state を実装する
- session command endpoints を実装する
- session Event を保存する

## 完了条件

- manual / opencode adapter kind を扱える
- Session state が projection で query できる

## 検証方法

- `cargo test -p owox-core session`
- `cargo test -p owox-server session`

## 依存関係

- Phase 06

## 成果物

- session model
