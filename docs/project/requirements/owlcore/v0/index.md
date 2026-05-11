# owlcore Requirements v1

## 役割

`owlcore` v1 は serverless repo-native 公式 plugin の要求正本です。project repo 内 `.owox/owlcore/` を正本とし、Context、Work Order、Work Contract、Evidence、Verifier、Policy、Event Log を扱います。

## 管轄

- owner: `owlcore`
- version: `v1`
- responsibility: project repo に紐づく文脈・作業契約・証拠・検収・監査

## 参照

- `REQ-owlcore-product-scope.md`: `owlcore` v1 の対象範囲と成功条件
- `REQ-owlcore-repo-native-store.md`: `.owox/owlcore/` repo-native 正本
- `REQ-context-governance.md`: Context の状態管理と正式化
- `REQ-work-contract.md`: Work Order / Work Contract による作業契約
- `REQ-evidence-verification.md`: Evidence と Verifier による検収
- `REQ-repo-worktree-isolation.md`: repo と worktree による作業隔離
- `REQ-policy-event-log.md`: Policy と Event Log による安全制約と監査
