# Task 001: @solid-primitives/i18n セットアップ + 辞書ファイル構造

## 目的

@solid-primitives/i18n をインストールし、日英辞書ファイル構造と翻訳関数プロバイダーを構築する。

## 前提条件

- SolidJS アプリが動作している

## 作業内容

- `@solid-primitives/i18n` をインストール
- 辞書ファイル構造を作成:
  ```
  src/i18n/
    index.ts          # プロバイダー + フック
    locales/
      en.ts           # 英語辞書
      ja.ts           # 日本語辞書
  ```
- 辞書のキー構造を設計:
  - `shell.*`: シェル共通 (ヘッダー、ナビゲーション)
  - `terminal.*`: ターミナル関連
  - `files.*`: ファイル関連
  - `git.*`: Git/Review 関連
  - `feedback.*`: エラー/確認関連
  - `common.*`: 共通 (OK, Cancel, Close 等)
- `I18nProvider` コンポーネントを作成
- `useI18n()` フックを提供
- `src/main.tsx` で `I18nProvider` をルートに配置

## 完了条件

- `useI18n()` で翻訳関数が取得できる
- 英語/日本語辞書が読み込まれる
- 型安全な翻訳キーが使用できる

## 検証方法

- 1 つのコンポーネントで `t('common.ok')` が動作することを確認

## 依存関係

- なし

## 成果物

- `src/i18n/index.ts` (新規)
- `src/i18n/locales/en.ts` (新規)
- `src/i18n/locales/ja.ts` (新規)
- `src/main.tsx` (変更)
- `package.json` (依存追加)
