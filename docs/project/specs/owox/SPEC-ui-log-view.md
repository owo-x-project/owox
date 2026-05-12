---
id: SPEC-ui-log-view
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
subproject: owox
---

# Log View

## 概要

terminal session log と operation log 表示の仕様。

## 関連要求

- `REQ-terminal-workspace`

## 入力

- selected project
- terminal session id
- command id
- log kind: terminal / operation / system
- log range request
- search / filter request

## 出力

- terminal session log
- Git / command operation log
- system / error log
- log search result
- log unavailable / deleted state

## 挙動

- log view は terminal session log、Git / command operation log、system / error log の 3 種を扱う。
- terminal log は session に紐づけて表示する。
- Git / command operation log は command execution result と紐づける。
- system / error log は error display の log ref から辿れる。
- 大きい log は range request / lazy load で読む。

## 状態遷移 / 不変条件

- log entry は selected project、session、command、error のいずれかに紐づく。
- deleted log は復元不能 state として表示する。
- redaction 済み log だけを表示する。

## エラー / 例外

- log file 欠落時は log unavailable とする。
- range request 失敗時は retry 可能 error とする。
- redaction metadata がない log は unsafe log として扱い、初期表示しない。

## 横断ルール

- log retention / redaction は `../../patterns/ops-log-retention-redaction.md` に従う。
- command execution result は `SPEC-shared-command-execution.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- terminal / operation / system の 3 種 log を切り替えられる。
- command result から operation log に辿れる。
- error display の log ref から system / error log に辿れる。
- deleted / unavailable / unsafe log state が表示できる。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
