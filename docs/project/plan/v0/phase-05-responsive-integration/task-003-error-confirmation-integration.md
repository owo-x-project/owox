# Task 003: Error Confirmation Integration

## 目的

error display と destructive confirmation を全機能で一貫して扱う。

## 前提条件

- HTTP / WebSocket error envelope と confirmation gate がある。
- file、terminal、Git の mutation 操作が実装済み。

## 作業内容

- error severity、source、actionability の表示 rules を UI 共通 component に統合する。
- discard、stop session、branch checkout、file overwrite などの confirmation を整理する。
- mobile / desktop 両方で confirmation が誤操作を招かないようにする。

## 完了条件

- 主要 error が同じ component / pattern で表示される。
- destructive operation は確認なしで実行されない。
- confirmation 表示が viewport によって破綻しない。

## 検証方法

- error component unit test。
- confirmation state unit test。
- destructive action fixture test。

## 依存関係

- `../phase-01-foundation-contracts/task-006-command-execution-contract.md`
- `../../../specs/owox/SPEC-shared-error-display.md`
- `../../../specs/owox/SPEC-shared-destructive-confirmation.md`

## 成果物

- common error display。
- confirmation UI。
