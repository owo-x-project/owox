# Task 001: UnoCSS インストール + Vite 統合

## 目的

UnoCSS を devDependency として追加し、Vite プラグインとして統合。既存 CSS と共存する構成を確立する。

## 前提条件

- Vite + vite-plugin-solid の構成が動作している
- `package.json` / `vite.config.ts` へのアクセスが可能

## 作業内容

- `unocss` と `@unocss/vite` をインストール
- `vite.config.ts` に UnoCSS プラグインを追加
- `uno.config.ts` を作成 (presetUno ベース)
- `src/main.tsx` に `import 'virtual:uno.css'` を追加
- 既存 `src/styles.css` は維持し、UnoCSS と共存させる
- ビルド・dev サーバーが正常動作することを確認

## 完了条件

- `vite dev` / `vite build` が成功する
- UnoCSS ユーティリティクラスが使える状態になっている
- 既存スタイルが壊れていない

## 検証方法

- `vite build` の成功
- テスト用に 1 つのコンポーネントで UnoCSS クラスを試用して動作確認

## 依存関係

- なし

## 成果物

- `uno.config.ts`
- `vite.config.ts` (変更)
- `package.json` (依存追加)
- `src/main.tsx` (import 追加)
