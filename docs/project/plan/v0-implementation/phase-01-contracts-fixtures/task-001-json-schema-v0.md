# Task 001 JSON Schema v0

## 目的

`.owox/` 正本、API payload、Rust protocol 型の共通契約となる v0 JSON Schema を作る。

## 前提条件

- Phase 00 完了
- `SPEC-json-schema-v0`

## 作業内容

- `contracts/schemas/v0/` に common / entity / event / evidence / command schema を追加する
- HandoffRecord schema を追加する
- required evidence kind enum を追加する

## 完了条件

- WorkContract、ContextCapsule、Evidence、Event、HandoffRecord schema が存在する
- `schema_version = "v0"` が必須である

## 検証方法

- schema linter または schema validation command

## 依存関係

- Phase 00

## 成果物

- v0 JSON Schema files
