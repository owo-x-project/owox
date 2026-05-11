---
id: SPEC-data-owlcore-layout
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-owlcore-repo-native-store.md
  - docs/project/adr/active/ADR-0003-owox-owlcore-product-split.md
---

# owlcore Layout

## 概要

`.owox/owlcore/` は `owlcore` の project repo 正本。Context、Work Order、Work Contract、Evidence、Policy、Verifier result、Event Log を Git 管理ファイルとして保存する。

## 関連要求

- `REQ-owlcore-repo-native-store`

## 入力

- `owlcore` CLI / library command
- `owox` plugin action
- Evidence artifact reference

## 出力

- `.owox/owlcore/` tree
- entity snapshot
- append-only Event JSONL
- rebuild input

## 挙動

- root は repo 直下の `.owox/owlcore/`。
- entity snapshot は種類別 JSON とする。
- Event は append-only JSONL とする。
- cache / index は任意であり、正本ではない。
- 旧 `.owox/` layout 互換は持たない。

## 初期 directory

- `.owox/owlcore/manifest.json`
- `.owox/owlcore/contexts/`
- `.owox/owlcore/work-orders/`
- `.owox/owlcore/contracts/`
- `.owox/owlcore/evidence/`
- `.owox/owlcore/policies/`
- `.owox/owlcore/verifier-runs/`
- `.owox/owlcore/events/`

## 状態遷移 / 不変条件

- Event は追記のみ。
- snapshot 更新と Event 追記は同じ logical command に属する。
- fresh clone から `owlcore` 状態を再構築できる。
- secret 本体を保存しない。

## エラー / 例外

- schema validation failure は command failure。
- Event と snapshot の revision 不一致は integrity failure。
- lock 競合時は write を中断する。

## 横断ルール

- `owlcore` は serverless。HTTP daemon を正本更新に必須としない。
- cache / index は `.owox/owlcore/` から再構築できる。

## 検証観点

- layout init が期待 directory を作る。
- schema invalid snapshot を検出できる。
- Event replay で snapshot と整合する。
- fresh clone から rebuild できる。

## 関連資料

- `../../requirements/owlcore/v1/REQ-owlcore-repo-native-store.md`
