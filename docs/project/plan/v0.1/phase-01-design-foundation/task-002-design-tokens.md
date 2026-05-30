# Task 002: owox ブランドカラーのデザイントークン定義

## 目的

owox ロゴのブルー〜シアングラデーション (#0077cc〜#00c8ff) を基調としたデザイントークンを UnoCSS テーマとして定義する。

## 前提条件

- Task 001 (UnoCSS セットアップ) が完了している

## 作業内容

- owox ロゴカラーを分析し、プライマリカラーパレットを定義
  - primary: #0077cc〜#00c8ff グラデーション
  - accent: シアン系
  - semantic: success/warning/danger/info
  - neutral: グレースケール (ライト/ダーク兼用)
- `uno.config.ts` の `theme.colors` にトークンを登録
- CSS 変数としても出力 (`--owox-color-*`)
- スペーシング・ラディウス・モーション変数も統合定義

## 完了条件

- `--owox-color-primary-*` 系の CSS 変数が使用可能
- UnoCSS ユーティリティ (`bg-primary-500` 等) が動作する
- 既存 `--color-*` 変数との対応表がコメントで残されている

## 検証方法

- ブラウザの DevTools で CSS 変数が確認できる
- UnoCSS のユーティリティクラスでカラーが適用される

## 依存関係

- `task-001-unocss-setup.md`

## 成果物

- `uno.config.ts` (テーマ拡張)
- カラーパレット定義
