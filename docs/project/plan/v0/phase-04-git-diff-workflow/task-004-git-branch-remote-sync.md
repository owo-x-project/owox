# Task 004: Git Branch Remote Sync

## 目的

branch checkout/create、fetch、pull、push、sync を WebUI から実行できるようにする。

## 前提条件

- Git status / branch read service と command result 表示がある。

## 作業内容

- branch checkout / create API を実装する。
- fetch / pull / push / sync API を実装する。
- conflict、auth failure、remote missing の error handling を実装する。

## 完了条件

- branch 切替と作成ができる。
- remote sync 系操作の成功 / 失敗が UI と log に出る。
- conflict と認証失敗をユーザーが識別できる。

## 検証方法

- local fixture repo test。
- remote fixture / fake remote test。
- error mapping unit test。

## 依存関係

- `task-003-git-stage-discard-commit.md`
- `../../../requirements/owox/v0/REQ-git-workflow.md`

## 成果物

- branch mutation API。
- remote sync API。
