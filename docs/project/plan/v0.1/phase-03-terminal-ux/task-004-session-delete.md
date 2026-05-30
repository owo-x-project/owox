# Task 004: セッション削除ボタン + 自動クリーンアップ

## 目的

不要なセッションを手動で削除するボタンと、終了済みセッションの自動クリーンアップを実装する。

## 前提条件

- Task 003 (リアルタイム状態反映) が完了している
- バックエンドの `DELETE /terminal/sessions/:id` API が動作する

## 作業内容

- セッションタブに削除ボタン (×) を追加:
  - ホバー時に表示
  - running 状態のセッションは確認ダイアログ付き (ConfirmDialog 再利用)
  - exited/terminated/failed 状態は即削除
- 自動クリーンアップ:
  - exited/terminated 状態のセッションを一定時間 (例: 30分) 後に自動削除
  - タイマーは SolidJS の `createEffect` + `setTimeout` で管理
  - 自動削除前にフェードアウトアニメーション (Phase 02 のリストアニメーション利用)
- 削除 API 呼び出し後にセッション一覧から除去

## 完了条件

- 各セッションタブに × ボタンがある
- running セッションの削除時に確認ダイアログが表示される
- 終了済みセッションが一定時間後に自動消滅する
- 削除後にタブ一覧が即座に更新される

## 検証方法

- × ボタンでセッション削除を確認
- running セッションの削除確認ダイアログを確認
- 自動クリーンアップのタイマー動作を確認

## 依存関係

- `task-003-realtime-state.md`

## 成果物

- `src/features/terminal/TerminalSurface.tsx` (変更)
- `src/features/terminal/terminal.css` (変更)
