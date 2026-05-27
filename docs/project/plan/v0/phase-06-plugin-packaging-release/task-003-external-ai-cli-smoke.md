# Task 003: External AI CLI Smoke

## 目的

external AI CLI を owox core ではなく任意 command として扱う導線を検証する。

## 前提条件

- terminal command launcher と Docker packaging がある。

## 作業内容

- fake AI CLI command を使う smoke を追加する。
- provider key や認証は external CLI 側責務であることを確認する。
- CLI missing / exit failure / long output の表示を確認する。

## 完了条件

- AI CLI 相当 command が terminal session として起動、監視、log 表示できる。
- owox core が provider 認証や rate limit 管理を実装していない。
- missing CLI と failure が error display に出る。

## 検証方法

- fake CLI smoke。
- long output fixture。
- scope review。

## 依存関係

- `../phase-03-terminal-log-runtime/task-005-terminal-command-launcher.md`
- `task-002-docker-selfhost-packaging.md`
- `../../../integrations/external-ai-cli.md`

## 成果物

- external AI CLI smoke。
- scope review notes。
