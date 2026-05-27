# Task 001: Project List API UI

## 目的

owox workspace root 直下の project repo を一覧し、workspace を選択できるようにする。

## 前提条件

- workspace boundary service と project discovery がある。

## 作業内容

- project list API を実装する。
- project metadata refresh と error handling を追加する。
- project list UI、empty state、open workspace action を実装する。

## 完了条件

- 直下 Git repo が project として表示される。
- workspace root 未設定 / repo なし / boundary error が表示される。
- project 選択で workspace route / state に遷移する。

## 検証方法

- project discovery route test。
- project list component unit test。

## 依存関係

- `../phase-01-foundation-contracts/task-003-workspace-boundary.md`
- `../../../specs/owox/SPEC-ui-project-list.md`

## 成果物

- project API。
- project list UI。
