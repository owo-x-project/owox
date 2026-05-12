---
id: SPEC-shared-error-display
status: 採用
related:
  - docs/project/validation.md
subproject: owox
---

# Error Display

## 概要

操作失敗、process failure、Git failure、filesystem failure の表示仕様。

## 関連要求

- `REQ-terminal-workspace`
- `REQ-git-workflow`

## 入力

- error kind
- message
- target
- recoverability
- next action
- log reference

## 出力

- inline error
- toast / notification
- modal error
- log link

## 挙動

- error display は分類と対処を表示する。
- error は `kind`、`message`、`target`、`recoverability`、`next_action`、`log_ref` を持つ。
- recoverable error は next action を提示する。
- raw stderr / stack trace は初期表示せず、log ref から辿れるようにする。

## 状態遷移 / 不変条件

- error は対象 project / session / command / file に紐づく。
- secret redaction 済み log への参照だけを表示する。

## エラー / 例外

- log ref が失われた場合は log unavailable として表示する。
- unknown error は unknown kind として扱う。

## 横断ルール

- command execution result の `error_kind` と接続する。
- log retention / redaction は `../../patterns/ops-log-retention-redaction.md` に従う。

## 検証観点

- error kind、recoverability、next action、log ref が UI に表示される。
- raw secret が error 表示に出ない。
- log ref から詳細に辿れる。

## 関連資料

- `index.md`
- `../../validation.md`
