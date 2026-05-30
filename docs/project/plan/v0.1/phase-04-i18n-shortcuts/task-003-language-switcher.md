# Task 003: 言語切替 UI + localStorage 永続化

## 目的

ユーザーが UI 上で言語を切り替えられるようにし、選択を永続化する。

## 前提条件

- Task 001 / 002 が完了している

## 作業内容

- 言語切替セレクター (ドロップダウンまたはトグル) をヘッダーバーに配置
- 選択肢: `日本語` / `English`
- 選択を `localStorage` に保存
- 初回アクセス時は `navigator.language` から推定
- リロード後も選択が維持される

## 完了条件

- ヘッダーに言語切替 UI がある
- 切替で即座に全ラベルが変わる
- リロード後も選択が維持される

## 検証方法

- 言語切替操作を確認
- リロード後の言語保持を確認

## 依存関係

- `task-002-i18n-extraction.md`

## 成果物

- LanguageSwitcher コンポーネント (新規)
- `src/features/shell/WorkspaceShell.tsx` (変更)
