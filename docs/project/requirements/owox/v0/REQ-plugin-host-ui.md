---
id: REQ-plugin-host-ui
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/adr/active/ADR-0003-owox-owlcore-product-split.md
---

# Plugin Host and Plugin UI

## 目標

`owox` は plugin が command、capability、固有 UI を追加できる host を提供する。

## 根拠

`owlcore` を公式 plugin として成立させ、将来 community plugin を作れるようにするには、plugin の読み込み、権限、UI mount、command integration が中核要件になる。

## 対象範囲

- plugin manifest を定義できる。
- plugin ID、名前、version、公式 plugin フラグ、必要 capability を宣言できる。
- plugin command を `owox` に登録できる。
- plugin UI を panel / view として mount できる。
- plugin が使う host capability を permission として明示できる。
- 公式 plugin は `owl*` 命名規則に従う。

## 対象外

- marketplace 公開。
- plugin 署名、課金、審査。
- remote plugin distribution。
- plugin 間依存解決の完全版。

## 成功指標

- 最小 plugin が command と UI view を追加できる。
- `owlcore` plugin が将来載せられる拡張面がある。
- plugin の必要 permission が人間に確認できる。

## 制約 / 品質条件

- plugin UI は `owox` 本体 UI と責務を混ぜない。
- plugin は host capability を明示せずに filesystem、process、network、repo 正本へアクセスしない。

## 関連資料

- `REQ-owox-product-scope.md`
- `../../../architecture.md`
