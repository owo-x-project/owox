# Validation

## 目的

このファイルは、変更時に確認すべき検証方針を記録します。

## 読むべき場面

- 変更後に何をどう確認すべきか整理したいとき
- 検証観点を追加または更新したいとき

## 検証項目

### Backend 堅牢性

- 対象: Rust / Axum server、PTY / process、WebSocket、session reconnect、log stream、SQLite。
- 手段: unit / integration / E2E を組み合わせ、terminal session 作成、入力、終了、再接続、log 復元、異常終了を確認する。
- 期待結果: browser reload 後に session / log を再表示でき、server 停止や process 終了時に状態が破綻しない。

### Responsive 同等操作

- 対象: PC、tablet、smartphone。
- 手段: browser E2E と実機相当 viewport で、project 選択、terminal、log、Git、file tree、editor、diff を確認する。
- 期待結果: 各 viewport で主要操作を完了できる。smartphone では drawer、tabs、sheets などで表示を切り替え、操作不可領域を作らない。

### Git 操作

- 対象: status、diff、stage、unstage、discard、commit、branch checkout/create、fetch、pull、push、sync。
- 手段: fixture repo を使い、各操作の成功、失敗、conflict、認証失敗表示を確認する。
- 期待結果: VS Code 標準 Source Control 相当の操作が WebUI から実行でき、破壊的操作は明示確認を経る。

### Terminal Renderer Prototype

- 対象: xterm.js、ghostty-web。
- 手段: 同じ WebSocket PTY adapter で prototype し、IME、copy/paste、resize、scrollback、fullscreen CLI、mobile input、1 万行 log、初期表示、入力遅延を比較する。
- 期待結果: 実用操作が破綻しない renderer を default 候補にできる。ghostty-web は互換性リスクを記録したうえで採否判断する。

### owox / owlcore 境界

- 対象: v0 owox と v1 owlcore。
- 手段: v0 実装で owlcore domain を直接実装していないこと、v1 設計で `.owox/owlcore/` 以外を正本にしていないことを review する。
- 期待結果: owox は実行・操作面、owlcore は repo 内制御・記録面に分離される。

### 外部依存

- 対象: Docker、external AI CLI、provider key、Git remote。
- 手段: Docker container、mounted repo、volume あり/なし、CLI あり/なし、Git remote 認証失敗を確認する。
- 期待結果: owox 本体は外部 SaaS に直接依存せず、AI provider 認証は外部 CLI 側責務として扱われる。
