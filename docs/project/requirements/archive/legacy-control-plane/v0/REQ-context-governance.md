---
id: REQ-context-governance
status: 採用
related:
  - docs/project/glossary/core.md
  - docs/project/architecture.md
---

# Context の状態管理と正式化

## 目標

Owox は、AI Agent や AI CLI に渡す文脈を、状態、正式化手順、必要最小化によって安全に管理する。

## 根拠

AI に全履歴や未検証情報を渡すと、古い情報、危険な情報、却下済み方針、secret が混入しやすい。Raw input を直接 Official Context にせず、渡す文脈を制御する必要がある。

## 対象範囲

- Context を `Raw`, `Proposed`, `Official`, `Deprecated`, `Rejected`, `Active Context` に分類する。
- Raw input は直接 Official Context に昇格しない。
- Official Context 変更は Context Proposal を経由する。
- Context Capsule は AI CLI / Agent に渡す必要最小文脈を表す。
- Context Capsule には active decisions、constraints、references、deprecated、forbidden context を含められる。
- 情報の本体、表示、外部 export を分けて扱う。

## 対象外

- 汎用 RAG として全履歴を AI に渡す機能。
- Obsidian や Markdown export を source of truth とする運用。
- AI が Official Context を直接編集する運用。
- Context Governance の高度な自動最適化。

## 成功指標

- Raw input から Proposed、Official への正式化状態を追跡できる。
- Context Capsule に含める情報と含めない情報を明示できる。
- Deprecated / Rejected な文脈が Active Context に混入しないことを確認できる。
- Official Context の変更には提案、検査、承認または却下の結果が残る。

## 制約 / 品質条件

- Official Context は Review / Policy Gate を通過した情報だけにする。
- secret や forbidden context を Context Capsule に含めない。
- 自然文は説明であり、機械判定には schema、policy、Verifier を使う。

## 関連資料

- `../../glossary/core.md`
- `../../architecture.md`
- `../../validation.md`
