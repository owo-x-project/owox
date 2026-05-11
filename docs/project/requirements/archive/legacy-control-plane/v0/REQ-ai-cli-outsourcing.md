---
id: REQ-ai-cli-outsourcing
status: 採用
related:
  - docs/project/integrations/ai-cli.md
  - docs/project/architecture.md
---

# AI CLI を外部 Worker として扱う外注フロー

## 目標

Owox は AI coding CLI を内蔵せず、Work Contract と Context Capsule を渡して作業させ、結果を Evidence として回収する外部 Worker として扱う。

## 根拠

OpenCode、Claude Code、Codex、Ruflo などは作業実行能力を持つ。Owox の価値は、これらを置き換えることではなく、発注前後の文脈、契約、証拠、検収、監査を管理することにある。

## 対象範囲

- AI CLI Session として、使用 CLI、model、worktree、Work Contract、Context Capsule、実行ログ、diff、Evidence、検収結果を記録する。
- Manual Outsource では、Owox が Work Contract と prompt を生成し、ユーザーが任意 AI へ渡し、結果を Owox に戻せる。
- MVP の深い統合候補は OpenCode とする。
- 将来、Claude Code、Codex、Ruflo などを adapter で接続できるようにする。

## 対象外

- AI coding CLI 本体の再実装。
- 最初から複数 CLI を完全統合すること。
- AI CLI の出力を無検収で受け入れること。
- AI CLI に重大判断を自動委任すること。

## 成功指標

- Work Contract と Context Capsule を AI CLI または Manual Outsource 用 prompt として渡せる。
- AI CLI Session に作業入力、実行結果、Evidence、検収結果が紐付く。
- OpenCode Adapter が未完成でも Manual Outsource により作業を回せる。
- AI CLI の失敗、timeout、証拠不足、契約違反を追跡できる。

## 制約 / 品質条件

- AI CLI は外部 Worker であり、Owox の Official Context や policy を直接変更しない。
- AI CLI 作業は worktree 上で行う。
- AI CLI から戻る diff、log、test result、note は Evidence として扱い、Verifier を通す。

## 関連資料

- `../../integrations/ai-cli.md`
- `../../architecture.md`
- `../../validation.md`
