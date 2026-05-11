---
id: REQ-policy-event-log
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-owlcore-product-scope.md
---

# Policy and Event Log

## 目標

`owlcore` は Policy と Event Log により、作業制約、承認、検収、重要操作を repo 内で追跡できるようにする。

## 根拠

AI Agent First な作業では、何が許可され、何が実行され、何を根拠に受け入れたかを後から確認できる必要がある。

## 対象範囲

- Policy の定義。
- Event Log の append-only 記録。
- Agent Session、Work Contract、Evidence、Verifier 結果との関連付け。
- 重要操作の時刻、主体、対象、結果の記録。

## 対象外

- 中央監査 server。
- SIEM。
- organization-wide policy 管理。

## 成功指標

- Work Contract から関連 Event を追跡できる。
- Event Log が追記型として検査できる。
- Policy 違反や不足 Evidence を Verifier が検出できる。

## 制約 / 品質条件

- Event Log は改変不能を暗号学的に保証しない。Git review と append-only validation で検査する。
- secret 本体を記録しない。

## 関連資料

- `REQ-evidence-verification.md`
- `REQ-owlcore-repo-native-store.md`
