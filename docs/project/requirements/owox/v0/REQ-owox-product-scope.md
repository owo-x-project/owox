---
id: REQ-owox-product-scope
status: 採用
related:
  - docs/project/adr/active/ADR-0003-owox-owlcore-product-split.md
  - docs/project/architecture.md
---

# owox v0 Product Scope

## 目標

`owox` v0 は、AI Agent First な Terminal Workspace と plugin host の最小核を提供する。

## 根拠

`owlcore` や将来の `owl*` plugin を成立させるには、先に AI CLI / agent session を動かす場所、plugin を読み込む host、plugin 固有 UI を表示する shell が必要である。

## 対象範囲

- Workspace を開ける。
- terminal session を作成、表示、終了できる。
- AI CLI / agent process の起動、監視、log 表示を扱える。
- Git diff を確認できる。
- 簡易 file tree と簡易 editor を扱える。
- preview / logs / approvals の基礎 UI を持つ。
- plugin manifest を読み込める。
- plugin command を登録できる。
- plugin 固有 UI を mount できる。
- 公式 plugin 命名規則 `owl*` を扱える。

## 対象外

- `owlcore` の Context / Work Contract / Evidence / Verifier の完全実装。
- brand repo / company context。
- community marketplace。
- 本格 IDE。
- LSP / debugger。
- Git hosting / CI/CD / deployment service の再実装。

## 成功指標

- ユーザーが `owox` で project workspace を開き、terminal session と AI CLI process を操作できる。
- plugin が command と UI panel を `owox` に追加できる。
- `owox` 本体 UI と plugin UI の境界が確認できる。
- AI CLI の log、diff、approval 操作が同じ workspace 内で辿れる。

## 制約 / 品質条件

- `owox` 本体は plugin 固有 domain を内蔵しない。
- AI CLI の出力を無検収で正本化しない。
- plugin host / plugin UI は v0 中核として扱う。

## 関連資料

- `../../../architecture.md`
- `../../../adr/active/ADR-0003-owox-owlcore-product-split.md`
