---
id: REQ-policy-event-audit
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/validation.md
---

# Policy と Event Log による安全制約と監査

## 目標

Owox は、権限、状態遷移、安全制約を Policy で判定し、重要操作を Event Log として追跡可能にする。

## 根拠

AI Agent と人間は間違える。scope 外変更、secret 漏洩、勝手な正式化、完了詐称、作業ログ消失を防ぐには、機械的な制約と監査記録が必要である。

## 対象範囲

- MVP Policy は固定ルールとして始める。
- Official Context を AI が直接変更できないようにする。
- AI CLI は worktree で作業する。
- accept 前に diff_scope_check を通す。
- secret path は Context Capsule にも CLI にも渡さない。
- forbidden paths に触れた diff を reject する。
- required evidence がない作業を Done にしない。
- Event Log は誰が、いつ、何を、なぜ、どの権限で、どの文脈に基づき、どんな結果になったかを記録する。

## 対象外

- MVP での複雑な Policy DSL。
- 完全自動の高リスク操作承認。
- Event Log を単なる debug log として扱うこと。
- secret 本体の保存。

## 成功指標

- Policy 違反が Acceptance 前に検出される。
- Official Context 変更、Work Contract 実行、Verifier 結果、Acceptance 結果が Event Log から追える。
- 失敗時に、どの contract、context、evidence、policy に基づく結果か確認できる。
- secret path、forbidden paths、scope 外変更を拒否できる。

## 制約 / 品質条件

- Event Log は監査記録であり、後から判断理由を追跡できる粒度で残す。
- Policy は自然文説明だけでなく、判定可能な条件として扱う。
- 高リスク変更や人間判断が必要な変更を自動 accept しない。

## 関連資料

- `../../architecture.md`
- `../../validation.md`
