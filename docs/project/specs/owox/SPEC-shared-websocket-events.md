---
id: SPEC-shared-websocket-events
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/validation.md
subproject: owox
---

# WebSocket Events

## 概要

terminal、log、Git、UI state で使う WebSocket event の横断仕様。

## 関連要求

- `REQ-terminal-workspace`

## 入力

- event type
- project id
- session id
- sequence
- timestamp
- payload
- subscription request

## 出力

- MessagePack encoded event envelope
- chunked payload event
- subscription acknowledgement
- error event

## 挙動

- WebSocket event は typed envelope とする。
- encoding は binary MessagePack とする。
- envelope は固定順 tuple `[v,t,id,p,s,ts,q,pl]` とする。
  - `v`: schema version
  - `t`: event type
  - `id`: event id
  - `p`: project id
  - `s`: session id
  - `ts`: server epoch milliseconds
  - `q`: stream sequence
  - `pl`: payload
- null / empty field は送信しない。
- log、diff、file content など大きい payload は ref + chunk / range request を使う。
- large payload ref は typed ref とし、kind、id、offset、length、optional hash を持つ。
- large payload の HTTP 取得は range request を使う。
- mobile では active surface の event を優先購読し、非表示 surface は summary / lazy load にする。
- terminal event type は `term.create`、`term.input`、`term.resize`、`term.output`、`term.state`、`term.close` とする。
- Git / file event type は `git.status`、`git.diff`、`git.op.start`、`git.op.done`、`file.tree`、`file.open`、`file.write`、`file.change` とする。
- UI / error / log event type は `log.chunk`、`log.state`、`ui.surface`、`ui.sheet`、`cmd.result`、`err.show`、`sub.ack` とする。

## Payload schema

### Terminal

- `term.create`: session create request / acknowledgement payload。
- `term.input`: `data`、`mode`、`encoding` を持つ。`mode` は text / binary / paste を表す。
- `term.resize`: `cols`、`rows` を持つ。
- `term.output`: 小さい出力は inline bytes、大きい出力は typed ref。`seq` と `redacted` を持つ。
- `term.state`: `state`、`exit_code`、`started_at`、`ended_at`、`reason` を持つ。
- `term.close`: `reason` を持つ。

### Git / File

- `git.status`: counts / files summary を持つ。
- `git.diff`: diff summary と `diff_ref` を持つ。large diff は range request で取得する。
- `git.op.start`: `op`、`command_id`、target summary を持つ。
- `git.op.done`: `op`、`command_id`、target summary、result / error ref を持つ。
- `file.tree`: `path`、`entries`、`version` を持つ。
- `file.open`: `path`、`kind`、`version`、metadata、`content_ref` を持つ。
- `file.write`: `path`、`kind`、`version`、operation result を持つ。
- `file.change`: `path`、`kind`、`version`、metadata を持つ。

### UI / Log / Error / Command

- `ui.surface`: `active_surface`、`context_id` を含む state patch を持つ。
- `ui.sheet`: `sheet_kind`、`open`、`mode`、`context_id` を含む state patch を持つ。
- `log.chunk`: `log_id`、range、chunks、`truncated` を持つ。
- `log.state`: `log_id`、state、size / retention metadata を持つ。
- `err.show`: `kind`、`message`、`target`、`recoverability`、`next_action`、`log_ref` を持つ。
- `cmd.result`: `SPEC-shared-command-execution.md` の command result schema を持つ。
- `sub.ack`: subscription id、scope、status を持つ。

## 状態遷移 / 不変条件

- sequence は同一 stream 内で順序判定に使う。
- timestamp は server epoch milliseconds とする。
- client は必要な surface / session / project の subscription を明示する。
- server は subscription 外の高頻度 event を送らない。

## エラー / 例外

- decode error は protocol error として扱う。
- subscription 不正は error event を返す。
- chunk 欠落時は再取得できる。
- range request が不正な場合は protocol / validation error として扱う。

## 横断ルール

- WebSocket event envelope は `../../patterns/api-websocket-event-envelope.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。
- large payload の range request は `SPEC-shared-http-api.md` に従う。

## 検証観点

- MessagePack encoded event を client / server で decode できる。
- tuple field order が schema version と一致する。
- event type ごとの payload schema が不要 field を送らない。
- active surface 以外の high frequency event が送られない。
- large payload が ref + chunk / range request で取得できる。
- mobile 低帯域想定で不要 event が増えない。

## 関連資料

- `index.md`
- `../../architecture.md`
- `../../validation.md`
