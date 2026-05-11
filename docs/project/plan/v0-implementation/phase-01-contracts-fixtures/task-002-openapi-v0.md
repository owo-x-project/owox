# Task 002 OpenAPI v0

## 目的

`/api/v1` の endpoint、command request / response、typed error を固定する。

## 前提条件

- Task 001 完了
- `SPEC-api-v0-contracts`

## 作業内容

- `contracts/openapi/owox.v0.yaml` を作成する
- command endpoint と resource endpoint を分ける
- Handoff create / refresh endpoint を含める
- typed error schema を含める

## 完了条件

- OpenAPI file が存在する
- MVP endpoint が含まれる
- common error model が含まれる

## 検証方法

- OpenAPI validation

## 依存関係

- Task 001

## 成果物

- `contracts/openapi/owox.v0.yaml`
