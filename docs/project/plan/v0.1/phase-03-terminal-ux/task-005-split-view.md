# Task 005: タブ + 縦横分割ビュー

## 目的

複数ターミナルをタブ切替だけでなく、縦横に分割して同時表示できるようにする。

## 前提条件

- Task 001〜004 が完了している
- 各セッションが独立した xterm.js インスタンスを持つ

## 作業内容

- ペインモデルの設計:
  - ツリー構造: `SplitNode (horizontal | vertical)` → `LeafNode (sessionId)`
  - ルートペイン → 分割操作で子ペインを追加
  - 各ペインにセッションを割り当て
- 分割操作 UI:
  - タブの右クリックメニューまたはボタンで「右に分割」「下に分割」
  - ドラッグでペインサイズ調整 (リサイズハンドル)
  - ペイン間のフォーカス移動 (クリックまたはキーボード)
- レイアウト:
  - CSS Grid / Flexbox でペインを配置
  - `min-width` / `min-height` で最小サイズを保証
  - 分割線にリサイズカーソルを表示
- xterm.js Fit addon の対応:
  - ペインリサイズ時に `fit()` を再実行
  - `ResizeObserver` でペインサイズ変更を検知
- タブバーとの統合:
  - タブバーには全セッションを表示
  - アクティブペインのセッションがハイライト
  - タブクリックで対応ペインにフォーカス移動

## 完了条件

- ターミナルを右/下に分割できる
- 各ペインが独立したセッションを表示する
- ペインサイズをドラッグで調整できる
- ペイン内のターミナルがリサイズに追従する

## 検証方法

- 分割操作でペインが追加されることを確認
- ペインリサイズでターミナルが追従することを確認
- 複数ペインで独立した入力/出力を確認

## 依存関係

- `task-001-plain-shell.md` 〜 `task-004-session-delete.md`

## 成果物

- `src/features/terminal/TerminalSurface.tsx` (大幅変更)
- `src/features/terminal/pane-model.ts` (新規)
- `src/features/terminal/SplitPane.tsx` (新規)
- `src/features/terminal/terminal.css` (変更)
