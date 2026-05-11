# owlcore Requirements v1

## 役割

`owlcore` v1 は project repo に紐づく local / file-based 制御・記録レイヤーの要求正本です。project repo 内 `.owox/owlcore/` を正本とし、Project Metadata、Work Order、Work Contract、Context Capsule、Evidence、Verifier、Policy、Event Log、Agent Session 記録を扱います。

## 管轄

- owner: `owlcore`
- version: `v1`
- responsibility: project repo に紐づく文脈・作業契約・証拠・検収・監査・再現性管理

## 参照

- `REQ-owlcore-product-scope.md`: `owlcore` v1 の対象範囲と成功条件
- `REQ-owlcore-repo-native-store.md`: `.owox/owlcore/` repo-native 正本
- `REQ-context-governance.md`: Context Capsule の状態管理
- `REQ-work-contract.md`: Work Order / Work Contract による作業契約
- `REQ-evidence-verification.md`: Evidence と Verifier による検収
- `REQ-policy-event-log.md`: Policy と Event Log による安全制約と監査
