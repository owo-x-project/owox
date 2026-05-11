# Task 003 Contract Fixtures

## 目的

schema / protocol / store / verifier tests が共有する valid / invalid fixture を作る。

## 前提条件

- Task 001 完了

## 作業内容

- `contracts/fixtures/v0/valid/` に代表 fixture を追加する
- `contracts/fixtures/v0/invalid/` に欠落 / enum 不正 / schema_version 不正 fixture を追加する
- HandoffRecord fixture を追加する

## 完了条件

- valid fixture が schema validation に通る
- invalid fixture が schema validation で拒否される

## 検証方法

- schema validation command

## 依存関係

- Task 001

## 成果物

- contract fixtures
