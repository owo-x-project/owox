# Task 004: End To End Workflow Smoke

## 目的

v0 主要 workflow が機能横断で成立することを最小 smoke で確認する。

## 前提条件

- responsive shell、terminal、file/editor、Git/diff、log が統合済み。

## 作業内容

- fixture repo を使う browser smoke を追加する。
- project open -> terminal command -> file edit -> diff -> stage -> commit の導線を確認する。
- reload reconnect と log 再表示を確認する。

## 完了条件

- 主要 workflow smoke が desktop / mobile 代表 viewport で通る。
- unit 重視と最短 release 方針を崩さず、E2E は壊れやすい箇所の最小導線に限定される。

## 検証方法

- browser smoke。
- fixture repo integration。

## 依存関係

- `task-002-mobile-workflow-panels.md`
- `task-003-error-confirmation-integration.md`
- `../../../validation.md`

## 成果物

- workflow smoke tests。
- viewport smoke checklist。
