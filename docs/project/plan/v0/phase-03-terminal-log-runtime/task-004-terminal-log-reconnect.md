# Task 004: Terminal Log Reconnect

## 目的

browser reload 後に terminal session / log を再表示できるようにする。

## 前提条件

- terminal WebSocket IO と log view baseline がある。

## 作業内容

- terminal output の log persistence を実装する。
- reconnect 時の session list、tail replay、current status 復元を実装する。
- log retention と truncation の最小制御を追加する。

## 完了条件

- reload 後に session と log が再表示される。
- ended session の exit status と log が確認できる。
- 長大 log が UI / DB を破綻させない。

## 検証方法

- reconnect integration test。
- log replay unit test。
- long log fixture test。

## 依存関係

- `task-002-terminal-websocket-io.md`
- `../phase-02-workspace-files-ui/task-005-log-view-baseline.md`
- `../../../specs/owox/SPEC-runtime-terminal-log-reconnect.md`

## 成果物

- terminal log persistence。
- reconnect restore。
