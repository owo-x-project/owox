---
id: REQ-owlcore-product-scope
status: 採用
related:
  - docs/project/adr/active/ADR-0003-owox-owlcore-product-split.md
  - docs/project/architecture.md
---

# owlcore v1 Product Scope

## 目標

`owlcore` v1 は、project repo に紐づく Context / Work / Evidence 制御プレーンを serverless 公式 plugin として提供する。

## 根拠

AI CLI 作業は、実行場所だけでは再現性、検収、監査を担保できない。project repo に残る文脈、作業契約、証拠、検収結果が必要である。

## 対象範囲

- project repo 内 `.owox/owlcore/` を初期化できる。
- project context を管理できる。
- Work Order を作成できる。
- Work Contract を生成できる。
- Evidence を登録できる。
- Verifier を実行できる。
- Policy と Event Log を扱える。
- `owlcore` CLI / library を提供する。
- `owox` plugin として固有 UI を提供する。

## 対象外

- 常駐 HTTP daemon。
- `owox` 本体の terminal / process manager 実装。
- brand repo / company context。
- community plugin marketplace。
- Git hosting / CI/CD / deployment service の再実装。

## 成功指標

- `owlcore` CLI で `.owox/owlcore/` を初期化できる。
- Context、Work Contract、Evidence、Verifier 結果、Event が Git 管理ファイルとして残る。
- `owox` 上で `owlcore` plugin UI を通じて project context と検収状態を確認できる。
- AI CLI 作業の diff / log / test result を Evidence として紐付けられる。

## 制約 / 品質条件

- `owlcore` は完全 serverless とする。
- 正本は `.owox/owlcore/` であり、cache / index は再構築可能にする。
- AI CLI は Official Context や Acceptance を直接確定しない。

## 関連資料

- `../../../architecture.md`
- `../../../adr/active/ADR-0003-owox-owlcore-product-split.md`
