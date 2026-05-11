# Requirements

## 役割

このディレクトリは、何を実現するかを管理する正本です。

## 置いてよいもの

- 目標
- 根拠
- 成功指標
- 対象範囲と対象外
- 制約や品質条件

## 置いてはいけないもの

- 実装手段の詳細
- テスト手順の詳細
- 一時的な作業メモ

## 命名規則

- `<owner>/v<major>/REQ-<category>-<short-title>.md`
- owner は `owox`、`owlcore`、`brand-repo` などの管轄名を使う

## 参照ルール

- 要求変更時は spec / validation / ADR への影響を確認する

## 参照

- `owox/index.md`: `owox` v0。AI Agent First Terminal Workspace / plugin host の要求
- `owlcore/index.md`: `owlcore` v1。serverless repo-native 公式 plugin の要求
- `brand-repo/index.md`: brand repo / brand context など v2 以降の要求
- `archive/legacy-control-plane/`: ADR-0003 以前の旧 Owox 制御プレーン要件
