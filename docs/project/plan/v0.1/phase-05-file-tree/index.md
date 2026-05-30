# Phase 05: ファイルツリー改善

## 目的

catppuccin/vscode-icons の SVG を抽出してファイルアイコンを実装し、隠しファイルの半透明表示+トグルを追加する。

## 前提条件

- Phase 01 (デザイン基盤) が完了している

## 完了条件

- ファイル/ディレクトリの種類に応じたアイコンが表示されている
- 隠しファイル (ドットファイル) が半透明で表示されている
- ワンタッチで隠しファイルを非表示にできるトグルがある

## 検証方法

- 主要ファイル形式 (.ts, .rs, .md, .json, etc.) で正しいアイコン確認
- 主要ディレクトリ名 (src, node_modules, .git, etc.) で正しいアイコン確認
- 隠しファイルの半透明表示確認
- トグルによる表示/非表示切替確認

## task 一覧

- `task-001-catppuccin-icons.md`: catppuccin/vscode-icons SVG 抽出 + バンドル + アイコン選択ロジック
- `task-002-hidden-files.md`: 隠しファイル半透明表示 + 表示/非表示トグル

## 依存関係

- `phase-01-design-foundation/`
