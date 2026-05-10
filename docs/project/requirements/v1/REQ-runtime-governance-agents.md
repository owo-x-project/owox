---
id: REQ-runtime-governance-agents
status: 提案中
related:
  - docs/project/requirements/v0/REQ-context-governance.md
  - docs/project/requirements/v0/REQ-work-contract.md
  - docs/project/requirements/v0/REQ-evidence-verification.md
---

# Governance Agent による判断補助

## 目標

Owox v1 は、実装 Worker ではなく Governance Agent として、文脈整理、契約生成、検収補助、監査、次アクション整理を支援する。

## 根拠

v0 は Core Coder Agent や自律的な COO を対象外にする。v1 では作業数と Context が増えた状態で、人間が見るべき判断、リスク、未検収事項を整理する補助が必要になる。

## 対象範囲

- CEO Secretary による判断待ち、リスク、次に見るべき項目の整理。
- Context Curator による文脈整理と正式化候補作成。
- Work Contract Builder による Work Order から Work Contract への変換補助。
- Verifier Agent による Evidence 検査補助。
- Auditor Agent による rule violation、context drift、scope violation の検出。

## 対象外

- Core Coder Agent。
- Swarm Manager。
- Autonomous COO。
- Full Planner。
- 重大判断の自動確定。

## 成功指標

- ユーザーが次に確認すべき Work Order、Evidence、Context Proposal、失敗 Session を把握できる。
- Governance Agent の提案と人間の採否が Event Log に残る。
- Context、Contract、Verifier、Audit の補助結果が根拠付きで確認できる。
- Agent が Official Context や Acceptance を直接確定しない。

## 制約 / 品質条件

- Governance Agent は判断補助に徹する。
- Agent の出力は Claim または Proposal として扱い、必要に応じて Review / Policy Gate を通す。
- 実装作業は外部 AI CLI / human Worker として扱う。

## 関連資料

- `../v0/REQ-context-governance.md`
- `../v0/REQ-work-contract.md`
- `../v0/REQ-evidence-verification.md`
- `../v0/REQ-policy-event-audit.md`
