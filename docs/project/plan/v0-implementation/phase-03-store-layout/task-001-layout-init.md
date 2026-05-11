# Task 001 Layout Init

## 目的

`.owox/` 初期 layout と manifest を作る。

## 前提条件

- Phase 02 Task 002 完了
- `SPEC-data-owox-layout`

## 作業内容

- `.owox/manifest.json` 生成を実装する
- contexts / work-orders / contracts / sessions / evidence / handoffs / events / index を作る
- layout validation を実装する

## 完了条件

- temp repo に `.owox/` layout を作れる
- manifest が schema validation に通る

## 検証方法

- `cargo test -p owox-store layout`

## 依存関係

- Phase 02

## 成果物

- store layout init
