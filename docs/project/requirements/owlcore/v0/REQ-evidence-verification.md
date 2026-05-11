---
id: REQ-evidence-verification
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-work-contract.md
  - docs/project/requirements/owlcore/v1/REQ-policy-event-log.md
---

# Evidence Verification

## 目標

`owlcore` は AI CLI / human worker の作業結果を Evidence と Verifier で検収できるようにする。

## 根拠

AI の完了報告だけでは、scope 内変更か、必要なテストが通ったか、契約を満たしたか判断できない。diff、log、test result、artifact、review note を証拠として扱う必要がある。

## 対象範囲

- Evidence を typed record として登録する。
- diff、command log、test result、artifact、review note、verifier report を扱う。
- Work Contract の required evidence を検査する。
- allowed paths / forbidden paths と diff scope を検査する。
- Verifier result を `.owox/owlcore/` に保存する。
- accept / reject / needs_revision の判断材料を提供する。

## 対象外

- CI/CD の再実装。
- Git hosting の review / merge 実装。
- AI の自己承認。
- `owox` terminal session runtime。

## 成功指標

- Evidence 不足が検出される。
- forbidden path 変更が accept 前に検出される。
- Verifier result と Acceptance decision が Event Log から追跡できる。

## 制約 / 品質条件

- required evidence 不足時は accepted にできない。
- blocking policy violation がある場合は accepted にできない。
- Verifier は `.owox/owlcore/` 正本、Git diff、Evidence を検査根拠にする。

## 関連資料

- `REQ-work-contract.md`
- `REQ-policy-event-log.md`
