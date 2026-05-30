# Task 003: 種別ごとの色分け・アイコン強化

## 目的

error/warning/info/success の視覚的区別を強化する。

## 前提条件

- Task 001 (トーストシステム) が完了している
- Phase 01 (デザイン基盤) の色定義が利用可能

## 作業内容

- 種別ごとのカラー定義を強化:
  - error: `--owox-color-danger` (赤系) + エラーアイコン
  - warning: `--owox-color-warning` (黄/オレンジ系) + 警告アイコン
  - info: `--owox-color-primary` (ブルー系) + 情報アイコン
  - success: `--owox-color-success` (緑系) + チェックアイコン
- 各種別に専用 SVG アイコンを追加:
  - error: 丸に × (circled-x)
  - warning: 三角に ! (triangle-alert)
  - info: 丸に i (circled-info)
  - success: 丸にチェック (circled-check)
- ErrorBanner (インライン表示用) にも同じ色分け・アイコンを適用
- トーストの左ボーダーを種別カラーに変更
- ダーク/ライト両テーマでの視認性確認

## 完了条件

- 4 種別が色とアイコンで明確に区別できる
- ライト/ダーク両テーマで視認性が確保されている
- トーストとインライン表示の両方に適用されている

## 検証方法

- 各種別のトーストを発生させて色・アイコン確認
- ライト/ダーク切替で視認性確認

## 依存関係

- `task-001-toast-system.md`
- Phase 01 (デザイントークン)

## 成果物

- `src/features/feedback/feedback.css` (変更)
- `src/features/feedback/ErrorBanner.tsx` (変更)
- `src/features/feedback/Toast.tsx` (変更)
- SVG アイコン (新規)
