# Task 004: 既存 CSS 変数を新テーマトークンへ段階移行

## 目的

既存の `--color-*` CSS 変数を新しい `--owox-*` トークンへ移行し、全コンポーネントがライト/ダーク両テーマで正常表示されるようにする。

## 前提条件

- Task 003 (テーマ切替) が完了している

## 作業内容

- `src/styles.css` の既存 `--color-*` 変数を新トークンへの参照に置換
- 各 feature CSS ファイルの直接カラー指定を CSS 変数参照へ置換
  - `src/features/terminal/terminal.css`
  - `src/features/files/files.css`
  - `src/features/git/git.css`
  - `src/features/git/diff/diff.css`
  - `src/features/feedback/feedback.css`
  - `src/features/log/log.css`
  - `src/features/terminal/renderer/renderer.css`
- xterm.js のハードコードテーマオブジェクト (`xterm-renderer.ts`) を CSS 変数から動的取得に変更
- CodeMirror テーマ (`Editor.tsx`) を新トークンに対応

## 完了条件

- 全画面がライト/ダーク両テーマで視覚的に一貫している
- ハードコードカラーが CSS 変数参照に置換されている
- xterm.js / CodeMirror がテーマ切替に追従する

## 検証方法

- 全画面 (Terminal/Files/Review/Log) をライト/ダーク両方で目視確認
- テーマ切替後にターミナル・エディタの色が変わることを確認

## 依存関係

- `task-003-light-dark-theme.md`

## 成果物

- `src/styles.css` (変更)
- 各 feature CSS ファイル (変更)
- `src/features/terminal/renderer/xterm-renderer.ts` (変更)
- `src/features/files/Editor.tsx` (変更)
