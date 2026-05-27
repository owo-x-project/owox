# Phase 06: Plugin Packaging Release

## 目的

v0 最小 plugin extension point、Docker packaging、release validation を整え、完全実装の完了判定を可能にする。

## 前提条件

- Phase 01-05 の v0 core 機能が実装済み。

## 完了条件

- plugin manifest、command contribution、backend hook 予約が実装済み。
- Docker セルフホストで workspace root、SQLite volume、external AI CLI command が扱える。
- 最短 release に必要な validation と docs cross-check が完了する。
- v0 core が非スコープ domain を内蔵していない。

## 検証方法

- plugin manifest parser unit test。
- Docker smoke。
- release checklist review。
- 必要最小限の手動 confirmation。
- external AI CLI fake command smoke。

## task 一覧

- `task-001-plugin-extension-point.md`: plugin manifest、command contribution、backend hook 予約を実装する。
- `task-002-docker-selfhost-packaging.md`: Docker packaging と volume / workspace root 設定を実装する。
- `task-003-external-ai-cli-smoke.md`: external AI CLI を任意 command として扱う smoke を整備する。
- `task-004-release-validation.md`: v0 release validation と正本 cross-check を実施する。

## 依存関係

- `../phase-01-foundation-contracts/index.md`
- `../phase-03-terminal-log-runtime/index.md`
- `../phase-05-responsive-integration/index.md`
- `../../../specs/owox/SPEC-plugin-extension-point.md`
- `../../../integrations/docker.md`
- `../../../integrations/external-ai-cli.md`
