# Task 004 Core Context Work

## 目的

Context と Work Order / Work Contract の domain command を実装する。

## 前提条件

- Task 003 完了

## 作業内容

- context propose / approve / reject / deprecate を実装する
- work order create を実装する
- work contract generate と required evidence template を実装する

## 完了条件

- Raw から Official へ直接遷移できない
- Work Contract に allowed / forbidden paths と required evidence が含まれる

## 検証方法

- `cargo test -p owox-core context`
- `cargo test -p owox-core work`

## 依存関係

- Task 003

## 成果物

- context / work core commands
