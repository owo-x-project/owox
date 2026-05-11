---
id: REQ-policy-event-log
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-evidence-verification.md
  - docs/project/requirements/owlcore/v1/REQ-owlcore-repo-native-store.md
---

# Policy and Event Log

## 目標

`owlcore` は project repo 作業の安全制約を Policy として判定し、重要操作を Event Log として追跡可能にする。

## 根拠

AI agent と人間の作業には、scope 外変更、secret 混入、完了詐称、判断理由の欠落が起きる。機械判定可能な policy と append-only event が必要である。

## 対象範囲

- fixed policy rule set を持つ。
- Official Context 直接変更を防ぐ。
- forbidden paths と secret paths を検査する。
- required evidence を検査する。
- human final gate を扱う。
- 誰が、いつ、何を、なぜ、どの context / contract / evidence に基づき判断したかを Event Log に残す。
- Event は `.owox/owlcore/` に append-only JSONL として保存する。

## 対象外

- 複雑な Policy DSL。
- 高リスク操作の完全自動承認。
- debug log を Event Log の代替にすること。
- secret 本体の保存。

## 成功指標

- Policy violation が accept 前に検出される。
- Context 変更、Work Contract 生成、Evidence 登録、Verifier 結果、Acceptance decision が Event Log から辿れる。
- Event Log を fresh clone から読み直せる。

## 制約 / 品質条件

- Event は追記のみ。
- 訂正は correction event で表現する。
- Policy は自然文説明だけでなく、判定可能な条件として扱う。

## 関連資料

- `REQ-evidence-verification.md`
- `REQ-owlcore-repo-native-store.md`
