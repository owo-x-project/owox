# Task 001: Plugin Extension Point

## 目的

v0 最小 extension point として plugin manifest、command contribution、backend hook 予約を実装する。

## 前提条件

- command launcher と backend route/service 境界がある。

## 作業内容

- plugin manifest schema と parser を実装する。
- command contribution を command launcher に表示できる境界を作る。
- backend hook は予約境界として定義し、汎用 plugin UI 実行基盤は実装しない。
- capability / permission の考え方を schema に残す。

## 完了条件

- valid / invalid manifest が判定できる。
- command contribution が v0 UI を不安定にしない範囲で扱える。
- plugin 固有 domain が core に混入していない。

## 検証方法

- manifest parser unit test。
- command contribution unit test。
- scope review。

## 依存関係

- `../phase-03-terminal-log-runtime/task-005-terminal-command-launcher.md`
- `../../../specs/owox/SPEC-plugin-extension-point.md`
- `../../../requirements/owox/v0/REQ-plugin-extension-point.md`

## 成果物

- plugin manifest schema。
- command contribution boundary。
- backend hook reservation。
