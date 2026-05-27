# Task 004: Release Validation

## 目的

v0 完全実装の完了判定に必要な最小検証と正本 cross-check を実施する。

## 前提条件

- Phase 01-06 の実装 task が完了している。

## 作業内容

- requirement / spec / validation に対する coverage checklist を作る。
- unit / 最小 integration / browser smoke / Docker smoke / 手動 checklist を release 判定として整理する。
- 非スコープ domain が core に入っていないか review する。
- 未解決の仕様差分を requirement / spec / ADR / validation 更新 task に切り出す。

## 完了条件

- v0 完了定義の各項目が最小 release 判定で検証済み。
- release validation の失敗条件が明確。
- 正本と実装の差分が残る場合、後続 task として分離済み。

## 検証方法

- release checklist。
- automated test suite。
- manual release checklist。
- docs cross-check。
- scope review。

## 依存関係

- `task-001-plugin-extension-point.md`
- `task-002-docker-selfhost-packaging.md`
- `task-003-external-ai-cli-smoke.md`
- `../../../validation.md`

## 成果物

- release validation checklist。
- v0 coverage matrix。
- follow-up task list。
