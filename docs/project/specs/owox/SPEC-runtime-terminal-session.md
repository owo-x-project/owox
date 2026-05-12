---
id: SPEC-runtime-terminal-session
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
subproject: owox
---

# Terminal Session

## 概要

terminal session の起動、入出力、状態の仕様。

## 関連要求

- `REQ-terminal-workspace`

## 入力

- selected project
- cwd
- command
- args
- environment overrides
- default shell / default command

## 出力

- session id
- process id metadata
- terminal output stream
- exit status
- session state

## 挙動

- terminal session は selected project repo 内の cwd で起動する。
- cwd、command、args、environment overrides を v0 で扱う。
- command 未指定時は default shell / default command を起動する。
- AI CLI は固有 adapter なしで任意 command として起動する。

## 状態遷移 / 不変条件

- terminal session state は `creating`、`running`、`exited`、`failed`、`terminated` の 5 状態とする。
- `creating` は process 起動準備中。
- `running` は process が生存し入出力可能。
- `exited` は process が正常または非 0 exit status で終了し、exit status を持つ。
- `failed` は process 起動に失敗した状態。
- `terminated` は user 操作または server 操作で終了させた状態。
- cwd は selected project repo boundary 内である。

## エラー / 例外

- cwd が repo boundary 外の場合は起動しない。
- command が見つからない場合は `failed` とする。
- process 起動後の非 0 exit は `exited` とし、exit status を保持する。

## 横断ルール

- command execution は `SPEC-shared-command-execution.md` に従う。
- workspace boundary は `SPEC-shared-workspace-boundary.md` に従う。
- WebSocket event は `SPEC-shared-websocket-events.md` に従う。

## 検証観点

- cwd、command、args、environment overrides 付きで session を作成できる。
- AI CLI command も通常 command と同じ扱いで起動できる。
- 5 状態が UI と API で矛盾しない。
- repo boundary 外 cwd で起動できない。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
