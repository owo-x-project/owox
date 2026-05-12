# owox Specs

## 役割

このディレクトリは、`owox` 固有の仕様を管理する正本です。

## v0 方針

- status: 採用
- 分割: requirement 対応 + owox 横断仕様
- 対象: `docs/project/requirements/owox/v0/`

## 仕様

- `SPEC-ui-workspace-shell.md`: workspace 全体 shell
- `SPEC-ui-project-list.md`: project 一覧と workspace 切替
- `SPEC-ui-file-tree.md`: file tree
- `SPEC-ui-editor.md`: 簡易 editor
- `SPEC-ui-diff-view.md`: diff view
- `SPEC-ui-log-view.md`: log view
- `SPEC-runtime-terminal-session.md`: terminal session 起動、入出力、状態
- `SPEC-runtime-terminal-log-reconnect.md`: terminal log と reconnect
- `SPEC-git-workflow.md`: Git workflow
- `SPEC-plugin-extension-point.md`: plugin extension point
- `SPEC-ui-responsive-webui.md`: responsive WebUI
- `SPEC-shared-workspace-boundary.md`: workspace boundary
- `SPEC-shared-websocket-events.md`: WebSocket events
- `SPEC-shared-error-display.md`: error display
- `SPEC-shared-destructive-confirmation.md`: destructive confirmation
- `SPEC-shared-command-execution.md`: command execution
- `SPEC-shared-http-api.md`: HTTP API endpoints

## 参照

- `../index.md`: specs 全体の入口
- `../../requirements/owox/v0/index.md`: `owox` v0 requirements
- `../../architecture.md`: `owox` v0 の不変条件と責務分離
- `../../validation.md`: 検証方針
