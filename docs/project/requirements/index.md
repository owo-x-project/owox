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
- owner は `owox` などの管轄名を使う

## 参照ルール

- 要求変更時は spec / validation / ADR への影響を確認する

## 参照

- `owox/v0/index.md`: `owox` v0。WebUI ベース Terminal Workspace / 簡易 IDE の要求
