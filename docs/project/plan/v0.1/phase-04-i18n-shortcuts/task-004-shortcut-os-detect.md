# Task 004: OS 検出による ⌘/Ctrl 自動切替

## 目的

ショートカット表記を Mac (⌘) / Windows (Ctrl) で自動切替する。

## 前提条件

- なし (Phase 01 完了が望ましいが独立可能)

## 作業内容

- OS 検出ユーティリティを作成:
  - `navigator.userAgent` または `navigator.platform` で Mac/Win/Linux を判定
  - Mac: `⌘` `⌥` `⇧` 表記
  - Win/Linux: `Ctrl` `Alt` `Shift` 表記
- ショートカット定義オブジェクトを作成:
  - `{ key: 'k', mod: 'primary' }` → Mac: `⌘K`, Win: `Ctrl+K`
- 全コンポーネントのハードコードショートカット表記を置換:
  - `WorkspaceShell.tsx`: `⌘K` → 動的表記
  - `Editor.tsx`: `⌘S` → 動的表記
- 表示用フォーマッタ関数: `formatShortcut(def) → string`

## 完了条件

- Mac でアクセス時に ⌘ 表記
- Win/Linux でアクセス時に Ctrl 表記
- ハードコード表記が残っていない

## 検証方法

- Chrome DevTools の User Agent 切替で表記変更を確認

## 依存関係

- なし

## 成果物

- `src/utils/platform.ts` (新規)
- `src/utils/shortcuts.ts` (新規)
- 該当コンポーネント (変更)
