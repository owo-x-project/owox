---
id: REQ-evidence-verification
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-work-contract.md
---

# Evidence and Verification

## 目標

`owlcore` は Evidence と Verifier により、作業成果が Work Contract を満たすか確認できるようにする。

## 根拠

AI CLI 作業では、diff、log、test result、確認記録が散らばりやすい。検収可能な証拠として repo 内に関連付ける必要がある。

## 対象範囲

- Evidence の登録。
- diff、log、test result、成果物、確認記録の関連付け。
- Verifier による scope、policy、必須証拠、受け入れ条件の確認。
- 検収履歴の記録。

## 対象外

- CI/CD service の再実装。
- 完全自動承認。
- provider 側出力の真偽保証。

## 成功指標

- Work Contract ごとに必要 Evidence が揃っているか確認できる。
- Verifier 結果が repo 内に残る。
- 検収履歴を後から再確認できる。

## 制約 / 品質条件

- Evidence は secret 本体を含まない。
- Verifier は失敗理由を追跡可能な形で残す。

## 関連資料

- `REQ-work-contract.md`
- `REQ-policy-event-log.md`
