---
status: 採用
related:
  - docs/project/specs/owox/SPEC-shared-command-execution.md
subproject: owox
---

# Command Execution Result

## 目的

terminal command と Git command の実行結果、exit status、stderr、UI 表示を一貫させる。

## 適用範囲

- terminal command
- Git command
- v1 以降で実行される plugin command contribution の host 実行結果

## 適用しない範囲

- AI CLI 固有 adapter の semantic result。
- 後続 plugin / integration の検収結果。

## パターン

- command execution result は structured result とする。
- `command_id`、`status`、`exit_code`、`stdout_ref`、`stderr_ref`、`started_at`、`ended_at`、`error_kind` を持つ。
- `status` は `queued`、`running`、`succeeded`、`exited_nonzero`、`failed_to_start` とする。
- `stdout_ref` / `stderr_ref` は任意 field とする。
- `error_kind` は `boundary`、`not_found`、`permission`、`timeout`、`auth`、`conflict`、`network`、`unknown` とする。
- stdout / stderr の本文は log reference に分離する。
- non zero exit は command failure ではなく command result として扱い、起動失敗と区別する。

## 適用条件

- process / Git command を実行する場合。
- v1 以降で plugin command contribution を host 実行する場合。

## 例外 / 逸脱条件

- terminal interactive stream は result 完了前に output event として流れる。

## 根拠

- UI、log、error display が command 種別に依存せず結果を扱える。

## 関連資料

- `../specs/owox/SPEC-shared-command-execution.md`
