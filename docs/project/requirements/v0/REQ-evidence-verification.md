---
id: REQ-evidence-verification
status: 採用
related:
  - docs/project/glossary/core.md
  - docs/project/validation.md
---

# Evidence と Verifier による検収

## 目標

Owox は、作業完了を自己申告ではなく Claim、Evidence、Verification によって判定する。

## 根拠

AI の完了報告は信用しすぎない。作業結果を受け入れるには、何を完了したという主張、証拠、検査結果が必要である。

## 対象範囲

- Evidence として diff、test result、screenshot、command log、artifact、review note、scope check、policy result を扱う。
- Verifier は diff scope、必須 Evidence、test result、forbidden file、human review を検査する。
- Acceptance は `submitted`, `verified`, `accepted`, `rejected`, `needs_revision` の状態を扱う。
- Acceptance 結果は Event Log に記録する。

## 対象外

- 証拠なしの Done。
- AI CLI 自身による自己承認。
- Verifier を UI 表示だけに依存させること。
- MVP での高度な品質メトリクスや自動リスク評価。

## 成功指標

- Work Contract の required evidence に対して Evidence の有無を確認できる。
- allowed paths 外の diff を reject または review required にできる。
- forbidden paths や secret path への変更を拒否できる。
- test result の成功または失敗を Acceptance 判断に反映できる。
- acceptance 結果と根拠 Evidence を後から追跡できる。

## 制約 / 品質条件

- `Done = Claim + Evidence + Verification` を守る。
- required evidence がない作業は Done にしない。
- accept 前に diff_scope_check を通す。
- human review が必要な変更を自動 accept しない。

## 関連資料

- `../../glossary/core.md`
- `../../validation.md`
- `../../architecture.md`
