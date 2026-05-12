# Patterns

## 役割

このディレクトリは、複数の仕様や実装で再利用する設計・実装パターンを管理する正本です。

## 置いてよいもの

- 共通パターン
- 適用条件
- 例外条件
- 関連する正本への参照

## 置いてはいけないもの

- 単発のローカル事情
- 詳細な作業手順
- ハーネス運用ルール

## 命名規則

- `impl-<slug>.md`
- `data-<slug>.md`
- `ui-<slug>.md`
- `ux-<slug>.md`
- `api-<slug>.md`
- `test-<slug>.md`
- `ops-<slug>.md`

## 参照ルール

- requirement や spec の代替にはしない
- 追加時は spec / implementation / validation への影響を確認する

## 参照

- `ui-workspace-shell.md`: Caelestia Shell 風 workspace shell
- `ui-shell-drawer-panel.md`: shell drawer / panel
- `ux-command-launcher.md`: command launcher
- `ux-mobile-bottom-shell.md`: mobile sheet shell
- `ui-caelestia-inspired-theme.md`: Caelestia inspired visual theme
- `api-workspace-boundary.md`: workspace boundary API
- `api-command-execution-result.md`: command execution result
- `api-websocket-event-envelope.md`: WebSocket event envelope
- `data-sqlite-managed-metadata.md`: SQLite managed metadata
- `ops-log-retention-redaction.md`: log retention / redaction
