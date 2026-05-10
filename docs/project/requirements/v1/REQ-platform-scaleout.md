---
id: REQ-platform-scaleout
status: 提案中
related:
  - docs/project/requirements/v0/REQ-product-mvp-scope.md
  - docs/project/tech-stack.md
---

# 個人利用を超える基盤拡張

## 目標

Owox v1 は、SQLite first の個人利用構成を前提にしながら、必要に応じて PostgreSQL、object storage、worker queue、secret store を利用できる拡張余地を定義する。

## 根拠

v0 は個人利用と local filesystem を優先する。v1 では作業数、Evidence、artifact、Session が増えた場合に保存、非同期処理、secret 管理を分離できる必要がある。

## 対象範囲

- PostgreSQL 利用時の要件を定義する。
- object storage に置く artifact / Evidence の境界を定義する。
- worker queue が必要な非同期処理を整理する。
- secret store の利用境界を定義する。
- SQLite / local filesystem からの移行要件を扱う。

## 対象外

- v1 で必ず PostgreSQL を必須化すること。
- 大規模 multi-tenant SaaS 要件。
- secret 本体を通常 DB に保存すること。
- deployment 基盤の内蔵。

## 成功指標

- 個人利用構成と拡張構成の境界が説明できる。
- Evidence、artifact、Session log の保存先を選択できる。
- 非同期処理が Event Log と整合する。
- secret path と secret 本体の扱いが Policy と矛盾しない。

## 制約 / 品質条件

- SQLite first を破壊しない。
- 拡張構成でも Work Contract、Evidence、Verifier、Event Log の追跡性を維持する。
- secret 本体は保存対象と表示対象を厳密に分ける。

## 関連資料

- `../v0/REQ-product-mvp-scope.md`
- `../../tech-stack.md`
- `../../validation.md`
