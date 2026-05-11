# Task 003 Verifier Rules

## 目的

v0 fixed rule catalog の rule を実装する。

## 前提条件

- Phase 02 完了
- `SPEC-crate-owox-verifier`

## 作業内容

- `VerifierRule` trait を定義する
- diff scope rule を実装する
- forbidden path / secret path rule を実装する
- required evidence / human final gate rule を実装する

## 完了条件

- 各 rule の positive / negative fixture test が通る
- stable rule code が policy spec と一致する

## 検証方法

- `cargo test -p owox-verifier rules`

## 依存関係

- Phase 02

## 成果物

- verifier rules
