# Task 002: Terminal WebSocket IO

## 目的

terminal session の input / output / resize / status を WebSocket event に接続する。

## 前提条件

- terminal session service がある。
- WebSocket event contract がある。

## 作業内容

- terminal output stream を WebSocket event として配信する。
- input、resize、stop request を WebSocket / HTTP action に接続する。
- backpressure、disconnect、late subscriber の扱いを実装する。

## 完了条件

- browser から terminal に入力できる。
- output と status が UI store に届く。
- disconnect しても server session が即破綻しない。

## 検証方法

- WebSocket integration test。
- terminal event reducer unit test。
- disconnect scenario test。

## 依存関係

- `task-001-terminal-session-service.md`
- `../phase-01-foundation-contracts/task-005-websocket-event-contract.md`

## 成果物

- terminal WebSocket bridge。
- terminal event tests。
