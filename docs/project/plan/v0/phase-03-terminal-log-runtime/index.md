# Phase 03: Terminal Log Runtime

## 目的

任意 command としての AI CLI を含む terminal session の起動、入出力、終了、resize、log、reconnect を完成させる。

## 前提条件

- Phase 01 の command execution / WebSocket / DB contract が完了。
- Phase 02 の workspace shell / log view が利用可能。

## 完了条件

- terminal session を作成、表示、入力、resize、終了できる。
- stdout / stderr / terminal output と exit status が log view に接続される。
- browser reload 後に session / log を再表示できる。
- terminal renderer adapter により xterm.js / ghostty-web prototype 比較が可能。

## 検証方法

- PTY / process lifecycle unit test。
- WebSocket terminal event integration test。
- reconnect fixture test。
- renderer adapter component unit test。

## task 一覧

- `task-001-terminal-session-service.md`: PTY / process lifecycle と session metadata を実装する。
- `task-002-terminal-websocket-io.md`: terminal 入出力、resize、status event を WebSocket に接続する。
- `task-003-terminal-renderer-adapter.md`: terminal renderer adapter と xterm.js baseline を実装する。
- `task-004-terminal-log-reconnect.md`: terminal log 永続化と reconnect 復元を実装する。
- `task-005-terminal-command-launcher.md`: 任意 command / AI CLI 起動 UI を実装する。

## 依存関係

- `../phase-01-foundation-contracts/index.md`
- `../phase-02-workspace-files-ui/index.md`
- `../../../specs/owox/SPEC-runtime-terminal-session.md`
- `../../../specs/owox/SPEC-runtime-terminal-log-reconnect.md`
- `../../../adr/active/ADR-0003-terminal-renderer-adapter.md`
