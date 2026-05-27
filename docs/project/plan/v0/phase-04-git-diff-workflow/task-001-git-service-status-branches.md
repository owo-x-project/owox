# Task 001: Git Service Status Branches

## 目的

project repo boundary 内で Git status と branch read 系を取得する service を実装する。

## 前提条件

- command execution contract と workspace boundary がある。

## 作業内容

- git status porcelain parser を実装する。
- current branch、local / remote branch list、upstream 状態を取得する。
- non-git repo、detached HEAD、command failure を error envelope に変換する。

## 完了条件

- status と branch 情報が API で取得できる。
- parser unit test が fixture を覆う。
- boundary 外 Git command が拒否される。

## 検証方法

- Git fixture repo test。
- parser unit test。
- error mapping test。

## 依存関係

- `../phase-01-foundation-contracts/task-006-command-execution-contract.md`
- `../../../specs/owox/SPEC-git-workflow.md`

## 成果物

- Git status service。
- branch read service。
