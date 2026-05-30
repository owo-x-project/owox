# Task 001: catppuccin/vscode-icons SVG 抽出 + バンドル + アイコン選択ロジック

## 目的

catppuccin/vscode-icons リポジトリから SVG アイコンを抽出し、ファイル拡張子・ディレクトリ名に基づく自動アイコン選択を実装する。

## 前提条件

- catppuccin/vscode-icons のライセンスが MIT であることを確認 (https://github.com/catppuccin/vscode-icons)

## 作業内容

- catppuccin/vscode-icons リポジトリから SVG アイコンを取得:
  - ファイルアイコン: typescript, javascript, rust, markdown, json, toml, yaml, html, css, svg, git, docker, license 等
  - ディレクトリアイコン: src, docs, tests, node_modules, .git, .github, target, build 等
  - デフォルトアイコン: generic file, generic folder
- SVG を `src/assets/icons/` に配置
- アイコン選択マッピングを作成:
  ```typescript
  // src/features/files/icons.ts
  export function fileIcon(name: string): string { ... }
  export function dirIcon(name: string, expanded: boolean): string { ... }
  ```
- 拡張子マッピング: `.ts` → typescript, `.rs` → rust, etc.
- ディレクトリ名マッピング: `src` → source, `tests` → test, etc.
- `FileTree.tsx` にアイコン表示を統合:
  - ファイル行の先頭にアイコンを表示
  - ディレクトリ行の先頭にフォルダアイコン (展開/折りたたみで切替)
- テーマ (ライト/ダーク) 対応: catppuccin にはラテ (ライト) とモカ (ダーク) がある

## 完了条件

- 主要ファイル形式に対応するアイコンが表示される
- 主要ディレクトリにカスタムアイコンが表示される
- 未対応の拡張子/ディレクトリにはデフォルトアイコンが表示される
- ライト/ダーク両テーマでアイコンが視認できる

## 検証方法

- 各拡張子 (.ts, .rs, .md, .json 等) でアイコン確認
- 特殊ディレクトリ (src, docs, .git 等) でアイコン確認
- テーマ切替でアイコン確認

## 依存関係

- なし

## 成果物

- `src/assets/icons/` (新規ディレクトリ + SVG ファイル)
- `src/features/files/icons.ts` (新規)
- `src/features/files/FileTree.tsx` (変更)
- `src/features/files/files.css` (変更)
