---
status: 採用
related:
  - docs/project/specs/owox/SPEC-shared-websocket-events.md
subproject: owox
---

# WebSocket Event Envelope

## 目的

terminal、log、Git、UI state の realtime event envelope を統一する。

## 適用範囲

- terminal output event
- log event
- Git status / operation event
- UI state event
- subscription event

## 適用しない範囲

- 大きい file content / diff / log 本文の一括送信。
- long-term persistence format。

## パターン

- WebSocket event は typed envelope とする。
- encoding は binary MessagePack とする。
- envelope は固定順 tuple `[v,t,id,p,s,ts,q,pl]` とする。
- `v` は schema version、`t` は event type、`id` は event id、`p` は project id、`s` は session id、`ts` は server epoch milliseconds、`q` は stream sequence、`pl` は payload。
- null / empty field は送信しない。
- 大きい payload は typed ref + chunk / range request に分離する。
- typed ref の本文取得は HTTP range request を使う。
- client は active surface / session / project の subscription を明示する。
- non-active surface は summary / lazy load を使う。
- event payload は type ごとの最小 schema とし、UI が表示に使わない field を送らない。
- terminal output、Git diff、file content、log chunks は inline と typed ref を payload size に応じて使い分ける。

## 適用条件

- realtime 更新が必要な UI。
- mobile 通信量を抑えたい event stream。

## 例外 / 逸脱条件

- 初期 HTML / static asset delivery には使わない。
- debug tooling では MessagePack を readable JSON に変換して表示してよい。
- schema version 不一致時は protocol error として扱ってよい。

## 根拠

- smartphone の通信制限下でも快適に使うため、event payload と subscription を最小化する。

## 関連資料

- `../specs/owox/SPEC-shared-websocket-events.md`
