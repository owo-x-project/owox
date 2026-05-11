# Task 002 Protocol Validation

## 目的

`Validated<T>` と明示 validation API を実装する。

## 前提条件

- Task 001 完了

## 作業内容

- `Validated<T>` を追加する
- `validate_json`, `validate_persisted_payload`, `validate_command_payload` を実装する
- valid / invalid fixture tests を追加する

## 完了条件

- invalid fixture が `VALIDATION_SCHEMA` になる
- store / server が呼べる API になっている

## 検証方法

- `cargo test -p owox-protocol validation`

## 依存関係

- Task 001

## 成果物

- protocol validation API
