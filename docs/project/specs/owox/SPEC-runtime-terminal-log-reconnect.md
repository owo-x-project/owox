---
id: SPEC-runtime-terminal-log-reconnect
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
  - docs/project/validation.md
subproject: owox
---

# Terminal Log And Reconnect

## 概要

terminal log の追跡、再表示、browser reload 後 reconnect の仕様。

## 関連要求

- `REQ-terminal-workspace`

## 入力

- session id
- terminal output chunks
- reconnect request
- log read request
- log delete request

## 出力

- append log file
- SQLite session / log metadata
- replayed terminal output
- reconnect result
- log deletion result

## 挙動

- session metadata は SQLite に保持する。
- terminal output は append log file に保持する。
- terminal output は保存前に既知 secret pattern を redaction する。
- browser reload 後、session metadata と append log file から log を再表示する。
- workspace 全体の log 容量上限を持つ。
- session log は手動削除できる。

## 状態遷移 / 不変条件

- session metadata と append log file は session id で対応する。
- append log file が欠落した場合も session metadata は読める。
- raw secret は terminal log の保存対象にしない。
- log 削除後、UI は deleted / unavailable state を表示する。

## エラー / 例外

- append log file が読めない場合は log unavailable error を表示する。
- redaction できない未知 secret は完全検出を保証しない。
- 容量上限到達時は新規操作を停止せず、古い / non-active session log から削除候補にする。
- 削除候補がない場合は warning を表示し、manual cleanup を促す。

## 横断ルール

- SQLite metadata は `../../patterns/data-sqlite-managed-metadata.md` に従う。
- log retention / redaction は `../../patterns/ops-log-retention-redaction.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- browser reload 後に session / log を再表示できる。
- terminal output が append log file に追記される。
- known secret pattern が保存前に redaction される。
- session log を手動削除できる。
- log 容量上限の到達状態を UI / log で確認できる。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
- `../../validation.md`
