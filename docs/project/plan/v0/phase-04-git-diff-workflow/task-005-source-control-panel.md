# Task 005: Source Control Panel

## 目的

Git status、diff、stage、commit、branch、remote sync を workspace shell に統合する。

## 前提条件

- Git read / mutation API と diff view がある。

## 作業内容

- Source Control panel を実装する。
- changed file list、stage state、commit box、branch picker、sync action を接続する。
- Git event を WebSocket / refresh に接続する。

## 完了条件

- VS Code 標準 Source Control 相当の主要操作が panel から完了する。
- 操作後に status / diff / log が更新される。
- error と confirmation が panel 内で破綻しない。

## 検証方法

- Source Control reducer unit test。
- panel component unit test。
- fixture repo smoke。

## 依存関係

- `task-004-git-branch-remote-sync.md`
- `../../../specs/owox/SPEC-git-workflow.md`

## 成果物

- Source Control panel。
- Git workspace integration。
