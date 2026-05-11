# Task 002 Store Unit Of Work

## 目的

Event append、snapshot update、index update をまとめる UnitOfWork を実装する。

## 前提条件

- Task 001 完了

## 作業内容

- `begin_command` を実装する
- `put_snapshot`, `append_event`, `commit`, `rollback` を実装する
- schema validation を write 前に呼ぶ

## 完了条件

- commit 成功時に Event / snapshot / index が揃う
- invalid payload は write 前に拒否される

## 検証方法

- `cargo test -p owox-store unit_of_work`

## 依存関係

- Task 001

## 成果物

- store UnitOfWork
