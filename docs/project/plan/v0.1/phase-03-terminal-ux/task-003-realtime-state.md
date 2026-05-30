# Task 003: WebSocket イベントによるリアルタイム状態反映

## 目的

セッションの作成・状態遷移 (creating→running→exited) を WebSocket イベントで即座に UI に反映する。

## 前提条件

- WebSocket transport の `term.state` イベントが受信できる
- `TerminalSocket` の `onState` ハンドラが存在する

## 作業内容

- セッション一覧の状態をリアクティブに管理:
  - SolidJS ストアでセッション一覧を管理
  - `term.state` イベント受信時にストアを更新
  - タブの状態バッジ (creating/running/exited 等) が即座に変わる
- 新規セッション作成時:
  - HTTP POST 後に `creating` 状態でタブを即座に追加
  - `term.state` で `running` に遷移したらバッジ更新
- セッション終了時:
  - `term.state` で `exited`/`terminated` を受信したらバッジ更新
  - タブに視覚的な終了表示 (グレーアウトなど)
- 手動リフレッシュボタンの廃止は検討 (残してもよいが主導線ではなくする)

## 完了条件

- セッション作成後にリフレッシュなしでタブが表示される
- 状態遷移がリアルタイムでバッジに反映される
- セッション終了がリアルタイムで表示される

## 検証方法

- セッション作成→状態遷移→終了の一連の流れをリフレッシュなしで確認

## 依存関係

- `task-001-plain-shell.md`

## 成果物

- `src/features/terminal/TerminalSurface.tsx` (変更)
- `src/features/terminal/session-model.ts` (変更)
- `src/features/terminal/transport.ts` (必要に応じて変更)
