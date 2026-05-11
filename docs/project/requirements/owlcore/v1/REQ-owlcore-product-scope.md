---
id: REQ-owlcore-product-scope
status: 採用
related:
  - docs/project/adr/active/ADR-0001-owox-owlcore-boundary.md
  - docs/project/architecture.md
---

# owlcore v1 Product Scope

## 目標

`owlcore` v1 は、project repo に紐づく local / file-based な制御・記録レイヤーを提供する。

## 根拠

AI CLI 作業は、実行場所だけでは再現性、検収、監査を担保できない。project repo に残る metadata、作業契約、文脈 capsule、証拠、検収結果、event log が必要である。

## 対象範囲

- project repo 内 `.owox/owlcore/` を初期化できる。
- Project Metadata を管理できる。
- Work Order を作成できる。
- Work Contract を生成できる。
- Context Capsule を管理できる。
- Evidence を登録できる。
- Verifier を実行できる。
- Policy と Event Log を扱える。
- Agent Session 記録を残せる。
- Codex を最初の深い CLI adapter 候補にする。

## 対象外

- 常駐 HTTP daemon。
- 中央 server。
- remote database。
- `owox` 本体の terminal / process manager 実装。
- team / multi-user 権限管理。
- Git hosting / CI/CD / deployment service の再実装。

## 成功指標

- `.owox/owlcore/` を初期化できる。
- Project Metadata、Work Contract、Context Capsule、Evidence、Verifier 結果、Event、Agent Session が Git 管理ファイルとして残る。
- fresh clone した repo から owlcore 状態を再構築できる。
- AI CLI 作業の diff / log / test result を Evidence として紐付けられる。

## 制約 / 品質条件

- `owlcore` は完全に repo-local / file-based とする。
- 正本は `.owox/owlcore/` であり、cache / index は再構築可能にする。
- AI CLI は Official Context や Acceptance を直接確定しない。

## 関連資料

- `../../../architecture.md`
- `../../../adr/active/ADR-0001-owox-owlcore-boundary.md`
