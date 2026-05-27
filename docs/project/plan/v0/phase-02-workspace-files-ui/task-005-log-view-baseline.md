# Task 005: Log View Baseline

## 目的

command / terminal / Git から共通利用する log view の基本表示を実装する。

## 前提条件

- command execution result と log metadata がある。
- workspace shell の panel 切替がある。

## 作業内容

- log list / detail API を実装する。
- log view UI、filter、follow tail、severity / source 表示を実装する。
- redaction 済み log の表示不変条件を test する。

## 完了条件

- log view が command result と接続できる。
- filter と追尾が動く。
- redacted secret が復元表示されない。

## 検証方法

- log repository unit test。
- log view reducer unit test。
- redaction display test。

## 依存関係

- `../phase-01-foundation-contracts/task-006-command-execution-contract.md`
- `task-002-workspace-shell-layout.md`
- `../../../specs/owox/SPEC-ui-log-view.md`

## 成果物

- log API。
- log view UI。
