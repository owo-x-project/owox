# Task 002: 全コンポーネントのハードコード文字列を翻訳キーに置換

## 目的

全コンポーネントに埋め込まれた英語ラベルを翻訳キーに置換する。

## 前提条件

- Task 001 (i18n セットアップ) が完了している

## 作業内容

- 以下のコンポーネントのハードコード文字列を `t()` 呼び出しに置換:
  - `WorkspaceShell.tsx`: "Command (⌘K)", "Terminal", "Files", "Review" 等
  - `CommandLauncher.tsx`: プレースホルダー、ボタンラベル
  - `TerminalSurface.tsx`: 状態ラベル "Creating", "Running", "Exited" 等
  - `FilesSurface.tsx` / `FileTree.tsx`: "New File", "New Folder", "Rename", "Delete" 等
  - `ReviewSurface.tsx` / `SourceControlPanel.tsx`: "Commit", "Stage", "Unstage", "Discard" 等
  - `DiffView.tsx`: "Unified", "Split", ファイル数表示
  - `ErrorBanner.tsx`: エラー種別ごとのヒント文
  - `ConfirmDialog.tsx`: "Confirm", "Cancel"、確認メッセージ
  - `LogView.tsx`: "Load More", "Delete" 等
  - `ProjectList.tsx`: 状態ラベル
  - `PluginCommandList.tsx`: カテゴリ、ヒント
- 英語辞書 (`en.ts`) と日本語辞書 (`ja.ts`) を対応させて記述

## 完了条件

- ハードコードの英語文字列がコンポーネント内に残っていない
- 全ラベルが `t()` 経由で表示されている
- 日英辞書に対応するキーが存在する

## 検証方法

- `grep -r` でハードコード文字列の残存確認
- 日英切替で全画面のラベルが変わることを確認

## 依存関係

- `task-001-i18n-setup.md`

## 成果物

- 全コンポーネントファイル (変更)
- `src/i18n/locales/en.ts` (更新)
- `src/i18n/locales/ja.ts` (更新)
