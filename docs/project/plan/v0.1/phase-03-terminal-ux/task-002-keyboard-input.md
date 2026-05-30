# Task 002: キーボード入力修正

## 目的

xterm.js へのキーボード入力が WebSocket 経由でバックエンドに正しく送信されるようにする。

## 前提条件

- xterm.js + WebSocket transport が動作している
- `TerminalSocket` の `send()` メソッドが `term.input` フレームを送信できる

## 作業内容

- xterm.js の `onData` / `onBinary` ハンドラが `TerminalSocket.send()` を呼び出しているか確認
- `xterm-renderer.ts` でキー入力のイベントハンドリングを修正:
  - `terminal.onData(data => socket.sendInput(data))` の接続確認
  - IME 入力だけでなく通常キー入力も送信されるようにする
- フォーカス管理:
  - セッション切替時に xterm.js にフォーカスを当てる
  - `terminal.focus()` の呼び出しタイミングを調整
- 特殊キー (Ctrl+C, Ctrl+D, Tab 等) の送信確認
- コピー/ペーストのキーバインド確認 (Ctrl+Shift+C/V)

## 完了条件

- 通常キー入力がターミナルに反映される
- IME 入力が引き続き動作する
- 特殊キー (Ctrl+C 等) が正常に送信される
- セッション切替時にフォーカスが正しく移る

## 検証方法

- ターミナルでコマンドを打鍵し、表示・実行を確認
- `Ctrl+C` でプロセス中断を確認
- Tab 補完を確認
- IME で日本語入力を確認

## 依存関係

- `task-001-plain-shell.md`

## 成果物

- `src/features/terminal/renderer/xterm-renderer.ts` (変更)
- `src/features/terminal/TerminalSurface.tsx` (変更)
