# Task 002: コミットログ一覧 UI + diff 表示統合

## 目的

コミット履歴をリスト表示し、選択コミットの diff を既存の DiffView で表示する。

## 前提条件

- Task 001 (API + モデル) が完了している

## 作業内容

- `CommitLog.tsx` コンポーネントを作成:
  - コミット一覧をリスト表示
  - 各コミット行: ショートハッシュ、著者、日時 (相対表示)、メッセージ先頭行
  - 選択状態のハイライト
  - Load More ボタンまたは無限スクロール
- ReviewSurface にタブ切替を追加:
  - 「Working Tree」タブ: 既存のワーキングツリー diff
  - 「History」タブ: コミットログ + コミット diff
- コミット選択 → diff 取得 → DiffView で表示のフロー
- コミット詳細: メッセージ全文、著者、日時、ハッシュ
- スタイリング: `git.css` にコミットログ用スタイル追加

## 完了条件

- Review 画面に History タブがある
- コミット一覧が時系列で表示される
- コミット選択で diff が表示される
- ページネーションが動作する

## 検証方法

- History タブでコミット一覧確認
- コミット選択で diff 表示確認
- 大量コミットのページネーション確認

## 依存関係

- `task-001-commit-log-api.md`

## 成果物

- `src/features/git/CommitLog.tsx` (新規)
- `src/features/git/ReviewSurface.tsx` (変更)
- `src/features/git/git.css` (変更)
