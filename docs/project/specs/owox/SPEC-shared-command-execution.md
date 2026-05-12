---
id: SPEC-shared-command-execution
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
  - docs/project/requirements/owox/v0/REQ-git-workflow.md
subproject: owox
---

# Command Execution

## 概要

terminal command と Git command の実行境界、cwd、env、exit status の横断仕様。

## 関連要求

- `REQ-terminal-workspace`
- `REQ-git-workflow`

## 入力

- command id
- selected project
- cwd
- command / args
- environment overrides
- operation kind

## 出力

- command id
- status
- exit code
- stdout reference
- stderr reference
- started at
- ended at
- error kind

## 挙動

- command execution result は structured result とする。
- result は `command_id`、`status`、`exit_code`、`stdout_ref`、`stderr_ref`、`started_at`、`ended_at`、`error_kind` を持つ。
- `status` は `queued`、`running`、`succeeded`、`exited_nonzero`、`failed_to_start` とする。
- `stdout_ref` / `stderr_ref` は任意 field とする。
- interactive terminal は terminal log ref、Git / one-shot command は stdout / stderr ref を持つ。
- `error_kind` は `boundary`、`not_found`、`permission`、`timeout`、`auth`、`conflict`、`network`、`unknown` とする。
- stdout / stderr の大きい本文は直接 result に含めず log reference にする。
- terminal command と Git command は同じ result pattern に揃える。

## 状態遷移 / 不変条件

- command id は 1 実行につき 1 つ。
- `succeeded` は exit code 0 と対応する。
- `exited_nonzero` は process 起動成功後の non-zero exit と対応する。
- `failed_to_start` は process / Git command が開始できなかった状態と対応する。
- command cwd は selected project repo boundary 内。
- started at / ended at は command lifecycle と矛盾しない。

## エラー / 例外

- command not found、permission denied、timeout、non zero exit、boundary violation を区別できる。
- stdout / stderr log が欠落した場合も result metadata は読める。

## 横断ルール

- workspace boundary は `SPEC-shared-workspace-boundary.md` に従う。
- command execution result は `../../patterns/api-command-execution-result.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- terminal command と Git command が同じ result shape で扱える。
- stdout / stderr が ref 経由で取得できる。
- error kind が UI の error display に接続できる。
- `succeeded` / `exited_nonzero` / `failed_to_start` が混同されない。

## 関連資料

- `index.md`
- `../../architecture.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
- `../../requirements/owox/v0/REQ-git-workflow.md`
