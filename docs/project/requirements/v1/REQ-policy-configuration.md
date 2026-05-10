---
id: REQ-policy-configuration
status: 提案中
related:
  - docs/project/requirements/v0/REQ-policy-event-audit.md
---

# 設定可能な Policy

## 目標

Owox v1 は、v0 の固定 Policy を拡張し、scope、secret、risk、review requirement を設定可能な Policy として扱う。

## 根拠

v0 は複雑な Policy DSL を対象外にする。v1 では project や workspace ごとの制約差を表現し、Verifier と Event Log による判定を一貫させる必要がある。

## 対象範囲

- Policy の設定項目を定義する。
- scope 外変更、forbidden paths、secret path、高リスク操作の判定条件を設定できる。
- review required や reject などの判定結果を表現する。
- Policy 判定結果を Verifier と Event Log に残す。

## 対象外

- 任意コード実行を伴う Policy。
- 完全自動の高リスク操作承認。
- secret 本体の保存。
- debug log だけに依存する監査。

## 成功指標

- workspace または repo ごとの Policy 差分を確認できる。
- Policy 違反の理由と根拠を Verifier 結果から追跡できる。
- 高リスク操作が review required になる。
- Policy 変更が Event Log に残る。

## 制約 / 品質条件

- Policy は自然文説明だけでなく判定可能な条件として扱う。
- v0 の最低限ルールを弱めない。
- Policy 変更自体も監査対象にする。

## 関連資料

- `../v0/REQ-policy-event-audit.md`
- `../v0/REQ-evidence-verification.md`
- `../../validation.md`
