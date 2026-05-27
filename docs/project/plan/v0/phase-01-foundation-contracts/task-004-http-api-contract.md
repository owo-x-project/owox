# Task 004: HTTP API Contract

## 目的

HTTP API の route skeleton、response envelope、error mapping を実装する。

## 前提条件

- workspace boundary service がある。
- shared error display の分類が参照できる。

## 作業内容

- `SPEC-shared-http-api.md` の endpoint skeleton を Axum route に分ける。
- success / error envelope と typed error code を実装する。
- client API wrapper と型検証を追加する。

## 完了条件

- endpoint skeleton が compile し、未実装機能は明示 error を返す。
- error envelope の unit test が通る。
- client から同じ contract を参照できる。

## 検証方法

- Axum route unit test。
- TypeScript API client unit test。
- schema serialization test。

## 依存関係

- `task-003-workspace-boundary.md`
- `../../../specs/owox/SPEC-shared-http-api.md`
- `../../../specs/owox/SPEC-shared-error-display.md`
- `../../../patterns/api-command-execution-result.md`

## 成果物

- HTTP route skeleton。
- API envelope。
- client API wrapper。
