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

## Rule catalog

- `POLICY_OFFICIAL_CONTEXT_DIRECT_WRITE`
  - severity: `critical`
  - blocking 条件: AI CLI / Agent が Official Context snapshot を直接変更する。
  - subject: `context_id`, changed path
- `POLICY_SECRET_PATH_EXCLUDED`
  - severity: `critical`
  - blocking 条件: secret path が Context Capsule、prompt、Evidence artifact、diff に含まれる。
  - subject: path
- `POLICY_FORBIDDEN_PATH_CHANGED`
  - severity: `error`
  - blocking 条件: changed path が Work Contract の `forbidden_paths` に一致する。
  - subject: path, contract_id
- `POLICY_DIFF_SCOPE_EXCEEDED`
  - severity: `error`
  - blocking 条件: changed path が `allowed_paths` 外で、明示許可 exception がない。
  - subject: path, contract_id
- `POLICY_REQUIRED_EVIDENCE_MISSING`
  - severity: `error`
  - blocking 条件: Work Contract の `required_evidence` が未充足。
  - subject: evidence kind, contract_id
- `POLICY_HUMAN_FINAL_GATE_REQUIRED`
  - severity: `error`
  - blocking 条件: accept command に人間 actor と reason がない。
  - subject: work_order_id
- `POLICY_SCHEMA_INVALID`
  - severity: `error`
  - blocking 条件: 永続 payload または command request が JSON Schema に違反する。
  - subject: schema name, pointer

## Secret path 判定

- secret path detector は path pattern と file name pattern を併用する。
- 初期 pattern は `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`, `.ssh/**`, `secrets/**`, `.aws/**`, `.config/**/credentials*`。
- binary artifact は拡張子だけで許可せず、Evidence 登録時に secret detector を通す。
- false positive の許可は Work Contract revision に明示 exception と reason を残す。

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
- rule code は API / UI / Verifier で同一文字列を使う。
- rule の無効化や緩和は Event と Work Contract revision に残す。

## 検証観点

- 各固定 rule が個別に失敗できる。
- blocking violation が command を止める。
- secret path fixture が positive / negative の両方を持つ。
- UI が severity と blocking を表示し、blocking accept を disabled にする。

## 関連資料

- `../../requirements/v0/REQ-policy-event-audit.md`
