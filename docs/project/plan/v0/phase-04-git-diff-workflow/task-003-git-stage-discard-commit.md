# Task 003: Git Stage Discard Commit

## 目的

stage、unstage、discard、commit を WebUI から実行できるようにする。

## 前提条件

- Git status service と diff view がある。
- destructive confirmation gate がある。

## 作業内容

- stage / unstage / discard / commit API を実装する。
- discard に confirmation required を適用する。
- commit message validation と command result 表示を追加する。

## 完了条件

- file 単位の stage / unstage が動く。
- discard は確認後のみ実行される。
- commit 成功 / 失敗が status、log、UI に反映される。

## 検証方法

- Git fixture operation test。
- destructive confirmation test。
- commit validation unit test。

## 依存関係

- `task-002-diff-view-api-ui.md`
- `../phase-01-foundation-contracts/task-006-command-execution-contract.md`
- `../../../specs/owox/SPEC-shared-destructive-confirmation.md`

## 成果物

- Git mutation API。
- commit UI state。
