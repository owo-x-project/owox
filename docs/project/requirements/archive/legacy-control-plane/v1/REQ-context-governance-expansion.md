---
id: REQ-context-governance-expansion
status: 提案中
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-context-governance.md
  - docs/project/glossary/core.md
---

# Context Governance の強化

## 目標

Owox v1 は、v0 の Raw / Proposed / Official 管理を拡張し、Context の鮮度、重複、正本性、棄却済み情報の混入を継続的に制御する。

## 根拠

v0 は Context Governance の高度な自動最適化を対象外にする。v1 では Context が増えた状態でも、AI に渡す文脈を必要最小かつ最新に保つ必要がある。

## 対象範囲

- Context Proposal を扱う。
- Context Linter を扱う。
- Canonical Knowledge を管理する。
- Deprecated / Rejected Context の管理を強化する。
- Context Capsule の freshness を確認する。
- Context の dedup check を扱う。

## 対象外

- 汎用 RAG として全履歴を AI に渡す機能。
- AI が Official Context を直接編集する運用。
- 自動判断だけで Official Context を昇格すること。
- Obsidian や Markdown export を source of truth とする運用。

## 成功指標

- Context Proposal の承認、却下、差し戻しを追跡できる。
- Deprecated / Rejected Context が Active Context に混入していないことを確認できる。
- Context Capsule の鮮度不足や重複候補を検出できる。
- Canonical Knowledge と派生メモの関係を確認できる。

## 制約 / 品質条件

- Raw input never becomes Official Context directly を維持する。
- Official Context の変更は Review / Policy Gate を通す。
- Linter や dedup check は判断補助であり、重大判断を自動確定しない。

## 関連資料

- `../v0/REQ-context-governance.md`
- `../../glossary/core.md`
- `../../validation.md`
