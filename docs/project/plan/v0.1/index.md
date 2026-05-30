# Frontend UX 改善計画 v1

## 目的

owox WebUI のデザイン品質・操作性・国際化を全面的に引き上げ、Caelestia Shell に匹敵するリッチ感と美しさを達成する。

## スコープ

- ライトテーマ + ダーク切替 (OS追従 + 手動切替)。owox ブランドカラー統一
- UnoCSS 導入によるスタイル基盤刷新
- グラスモーフィズム・マイクロインタラクション・ページ遷移・リストアニメーション追加
- ジッター・レイアウト崩れの解消
- ターミナル UX 全面改善 (プレーンシェル起動、キーボード入力修正、セッション削除、リアルタイム状態反映、自動クリーンアップ、タブ+縦横分割)
- @solid-primitives/i18n による日英多言語対応
- ショートカット表記の OS 自動切替、ヘルプパネル、ツールチップ表示
- ファイルツリー: catppuccin/vscode-icons SVG 抽出バンドル、隠しファイル半透明+トグル
- Review: コミットログ一覧 + diff 表示
- エラー表示: トースト自動消滅、×ボタン、スタック表示、色分け強化、エラーログパネル

## 非スコープ

- バックエンド API の仕様変更 (既存 API で実現できる範囲に限定)
- モバイル専用の大規模レイアウト変更
- プラグインシステムの機能拡張
- CodeMirror エディタの機能追加

## 前提

- SolidJS ベースの既存フロントエンド構成を維持
- 既存の CSS 変数・BEM 命名を UnoCSS へ段階的に移行
- バックエンドの terminal/git API は既存契約を前提

## 完了定義

- 全フェーズの task が完了条件を満たしている
- ライト/ダーク両テーマで視覚的な一貫性がある
- 日英切替が全 UI ラベルで動作する
- ターミナルがプレーンシェルとして起動・入力・削除・分割できる
- コミット履歴の閲覧と diff 表示ができる
- ファイルツリーに catppuccin アイコンと隠しファイル半透明表示がある
- エラーがトーストで表示され、自動消滅・手動 dismiss できる
- `prefers-reduced-motion` 時にアニメーションが無効化される

## フェーズ一覧

- `phase-01-design-foundation/index.md`: デザイン基盤 (UnoCSS 導入、owox テーマトークン、ライト/ダーク切替)
- `phase-02-animation-layout/index.md`: アニメーション・レイアウト磨き込み (グラスモーフィズム、マイクロインタラクション、ページ遷移、リストアニメーション、ジッター解消)
- `phase-03-terminal-ux/index.md`: ターミナル UX 改善 (プレーンシェル、入力修正、削除、リアルタイム更新、自動クリーンアップ、分割ビュー)
- `phase-04-i18n-shortcuts/index.md`: 国際化・ショートカット改善 (@solid-primitives/i18n、OS 検出表記、ヘルプパネル)
- `phase-05-file-tree/index.md`: ファイルツリー改善 (catppuccin アイコン、隠しファイル半透明+トグル)
- `phase-06-review-history/index.md`: Review・コミット履歴 (ログ一覧 + diff 表示)
- `phase-07-error-feedback/index.md`: エラー・フィードバック改善 (トースト自動消滅、dismiss、スタック、色分け、ログパネル)

## 依存関係

- `docs/project/plan/v0/`: v0 基盤計画の完了が前提
- `docs/project/specs/`: 各 SPEC の UI 契約を参照
- `docs/project/patterns/`: 既存 API パターンを参照

## 検証方針

- 各フェーズごとにブラウザでの視覚確認
- 既存テストスイート (`tests/client/`) の通過
- `prefers-reduced-motion` 動作確認
- 日英切替の全画面確認
- Win/Mac でのショートカット表記確認
