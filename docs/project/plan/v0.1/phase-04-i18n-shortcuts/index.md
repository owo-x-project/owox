# Phase 04: 国際化・ショートカット改善

## 目的

@solid-primitives/i18n による日英多言語対応と、ショートカットの OS 自動切替・発見性改善を実装する。

## 前提条件

- Phase 01 (デザイン基盤) が完了している

## 完了条件

- 全 UI ラベルが日英切替できる
- ショートカット表記が Mac/Windows で自動切替される
- ショートカットヘルプパネルが存在する
- ボタンのツールチップにショートカットが表示される

## 検証方法

- 言語切替で全画面のラベルが日英で変わることを確認
- Mac/Win それぞれでショートカット表記を確認
- ヘルプパネルの表示を確認

## task 一覧

- `task-001-i18n-setup.md`: @solid-primitives/i18n セットアップ + 辞書ファイル構造
- `task-002-i18n-extraction.md`: 全コンポーネントのハードコード文字列を翻訳キーに置換
- `task-003-language-switcher.md`: 言語切替 UI + localStorage 永続化
- `task-004-shortcut-os-detect.md`: OS 検出による ⌘/Ctrl 自動切替
- `task-005-shortcut-help.md`: ショートカットヘルプパネル + ツールチップ表示

## 依存関係

- `phase-01-design-foundation/`
