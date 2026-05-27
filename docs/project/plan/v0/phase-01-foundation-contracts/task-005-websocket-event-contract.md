# Task 005: WebSocket Event Contract

## 目的

terminal、Git、file、log、error、command result を配信する WebSocket event contract を実装する。

## 前提条件

- HTTP API contract がある。
- server / client の serialization 方針が決まっている。

## 作業内容

- WebSocket endpoint と subscription lifecycle を追加する。
- event envelope、event type、payload schema を実装する。
- client 側 event store / dispatcher の最小実装を追加する。

## 完了条件

- WebSocket 接続、subscribe、event dispatch、disconnect が動く。
- event payload の serialization / deserialization test が通る。
- unknown event が UI を壊さず error handling される。

## 検証方法

- WebSocket unit / integration test。
- TypeScript reducer unit test。

## 依存関係

- `task-004-http-api-contract.md`
- `../../../specs/owox/SPEC-shared-websocket-events.md`
- `../../../patterns/api-websocket-event-envelope.md`

## 成果物

- WebSocket endpoint。
- event schema。
- client event store。
