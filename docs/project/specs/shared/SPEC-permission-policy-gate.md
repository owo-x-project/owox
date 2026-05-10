---
id: SPEC-permission-policy-gate
status: 採用
related:
  - docs/project/requirements/v0/REQ-policy-event-audit.md
---

# Policy Gate

## 概要

v0 Policy は固定 rule set とし、accept 前に安全核と検収条件を判定する。

## 関連要求

- `REQ-policy-event-audit`

## 入力

- command
- actor
- Work Contract
- Context Capsule
- diff / changed paths
- Evidence

## 出力

- policy result
- typed violation
- Event

## 挙動

- v0 rule set は Official 直変更禁止、secret 除外、forbidden path reject、diff scope、required evidence、human final を含む。
- violation は `code`, `severity`, `subject`, `blocking`, `message`, `evidence_links` を持つ。
- blocking violation がある command は成功しない。

## 状態遷移 / 不変条件

- AI CLI / Agent は Official Context を直接変更できない。
- secret path は Capsule にも CLI 入力にも含めない。
- accept 前に diff_scope_check を通す。

## エラー / 例外

- forbidden path diff は blocking violation。
- required evidence 不足は blocking violation。
- human final 未実施は accept command の blocking violation。

## 横断ルール

- Policy result は Evidence type として保存できる。
- API error は violation を含められる。

## 検証観点

- 各固定 rule が個別に失敗できる。
- blocking violation が command を止める。

## 関連資料

- `../../requirements/v0/REQ-policy-event-audit.md`
