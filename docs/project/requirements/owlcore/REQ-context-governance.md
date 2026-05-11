---
id: REQ-context-governance
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-owlcore-product-scope.md
  - docs/project/requirements/owlcore/v1/REQ-owlcore-repo-native-store.md
---

# Context Governance

## 目標

`owlcore` は project repo に紐づく context を状態管理し、AI CLI / agent に渡す文脈を必要最小限に制御する。

## 根拠

AI に未検証情報、古い判断、secret、却下済み方針を渡すと、scope 逸脱や誤判断が起きる。project repo ごとに正式化済み context と作業時 context を分ける必要がある。

## 対象範囲

- Raw / Proposed / Official / Deprecated / Rejected の context 状態を扱う。
- Official Context 変更は proposal / review を経由する。
- Context Capsule を生成する。
- forbidden context と secret path を Context Capsule から除外する。
- `.owox/owlcore/` に context snapshot と Event を保存する。
- `owox` plugin UI から context 状態を確認できる。

## 対象外

- 汎用 RAG。
- brand repo context。
- AI が Official Context を直接確定する運用。
- company-wide knowledge base。

## 成功指標

- project repo 内の Official Context を確認できる。
- Context Capsule に含める情報と除外する情報を追跡できる。
- Context の採用、却下、廃止が Event Log に残る。

## 制約 / 品質条件

- Raw input は直接 Official Context にしない。
- secret 本体を保存しない。
- Context Capsule は Work Contract と紐付ける。

## 関連資料

- `REQ-owlcore-product-scope.md`
- `REQ-owlcore-repo-native-store.md`
