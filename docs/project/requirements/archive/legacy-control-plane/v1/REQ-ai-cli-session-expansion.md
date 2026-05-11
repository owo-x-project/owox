---
id: REQ-ai-cli-session-expansion
status: 提案中
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-ai-cli-outsourcing.md
  - docs/project/integrations/ai-cli.md
---

# AI CLI Session と adapter の拡張

## 目標

Owox v1 は、v0 の Manual Outsource と OpenCode 初期連携を拡張し、AI CLI Session の再現性、回復性、複数 CLI 接続性を高める。

## 根拠

v0 は OpenCode と Manual Outsource を優先し、複数 CLI の完全対応を対象外にする。v1 では実運用で必要になる session log 確認、contract replay、失敗復旧、adapter interface 整理を扱う必要がある。

## 対象範囲

- OpenCode 連携を強化する。
- AI CLI Session の log viewer を提供する。
- Work Contract と Context Capsule に基づく contract replay を扱う。
- failed session recovery を扱う。
- CLI ごとの adapter interface を整理する。
- Claude Code、Codex、Ruflo adapter の接続可否と優先度を検討する。

## 対象外

- AI coding CLI 本体の再実装。
- すべての CLI を同時に完全対応すること。
- AI CLI の出力を無検収で受け入れること。
- 高リスク判断の自動委任。

## 成功指標

- ユーザーが AI CLI Session の入力、log、diff、Evidence、検収結果を追跡できる。
- 失敗した Session の原因と復旧方針を確認できる。
- 同一 Work Contract を replay し、結果比較に必要な情報を残せる。
- 新しい CLI adapter 追加時の必須 contract と Evidence が明確である。

## 制約 / 品質条件

- v0 の Work Contract、Context Capsule、Evidence、Verifier の境界を維持する。
- adapter は Official Context や Policy を直接変更しない。
- CLI 固有機能に依存しすぎず、共通 Session モデルを保つ。

## 関連資料

- `../v0/REQ-ai-cli-outsourcing.md`
- `../../integrations/ai-cli.md`
- `../../validation.md`
