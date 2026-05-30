# Phase 03: ターミナル UX 改善

## 目的

ターミナルを VSCode/Ghostty 相当の使い勝手に引き上げる。プレーンシェル起動、キーボード入力、セッション管理、リアルタイム更新、分割ビューを実装する。

## 前提条件

- Phase 01 (デザイン基盤) が完了している
- バックエンドの terminal API (create/list/remove/logRange) が動作している
- WebSocket transport が動作している

## 完了条件

- コマンド未指定でデフォルトシェル ($SHELL) が起動する
- xterm.js へのキーボード入力が WebSocket 経由でバックエンドに送信される
- セッション作成・終了が即座に UI に反映される (リフレッシュ不要)
- 終了済みセッションの削除ボタンが存在する
- exited/terminated セッションが一定時間後に自動削除される
- タブ+縦横分割ビューが動作する

## 検証方法

- 新規ターミナル作成でプレーンシェルが起動することを確認
- キー入力がターミナルに反映されることを確認
- セッション終了が即座にタブ状態に反映されることを確認
- 削除ボタンでセッションが消えることを確認
- 分割操作 (縦/横) でペインが追加されることを確認

## task 一覧

- `task-001-plain-shell.md`: プレーンシェル起動 (コマンド未指定でデフォルトシェル)
- `task-002-keyboard-input.md`: キーボード入力修正 (xterm.js→WebSocket)
- `task-003-realtime-state.md`: WebSocket イベントによるリアルタイム状態反映
- `task-004-session-delete.md`: セッション削除ボタン + 自動クリーンアップ
- `task-005-split-view.md`: タブ + 縦横分割ビュー

## 依存関係

- `phase-01-design-foundation/`
