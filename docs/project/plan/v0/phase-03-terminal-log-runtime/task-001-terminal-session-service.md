# Task 001: Terminal Session Service

## 目的

workspace project 内で terminal session を作成、追跡、終了する service を実装する。

## 前提条件

- command execution contract と session metadata repository がある。

## 作業内容

- PTY / process spawn、cwd、environment、args validation を実装する。
- session state model を DB metadata に接続する。
- exit status、signal、abnormal termination を記録する。

## 完了条件

- session create / stop / exit state が追跡される。
- workspace boundary 外 cwd が拒否される。
- abnormal termination が error / log に出る。

## 検証方法

- process lifecycle unit test。
- boundary negative test。
- session repository test。

## 依存関係

- `../phase-01-foundation-contracts/task-006-command-execution-contract.md`
- `../../../specs/owox/SPEC-runtime-terminal-session.md`

## 成果物

- terminal session service。
- session lifecycle test。
