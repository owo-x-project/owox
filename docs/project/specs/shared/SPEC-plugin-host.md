---
id: SPEC-plugin-host
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-plugin-host-ui.md
  - docs/project/adr/active/ADR-0003-owox-owlcore-product-split.md
---

# Plugin Host

## 概要

`owox` plugin host は、plugin manifest、permission、command、plugin UI mount、host capability を扱う。

## 関連要求

- `REQ-plugin-host-ui`

## 入力

- plugin manifest
- plugin command registration
- plugin UI entry
- requested host capability

## 出力

- registered plugin
- command contribution
- mounted plugin UI
- permission state

## 挙動

- plugin は ID、name、version、official flag、required capabilities を manifest に宣言する。
- 公式 plugin は `owl*` 命名規則を使う。
- plugin command は command palette / panel action から起動できる。
- plugin UI は `owox` shell の panel / view に mount できる。
- host capability は filesystem、terminal/session、Git diff、workspace metadata、plugin storage などに分ける。
- plugin は宣言していない capability を使えない。

## 状態遷移 / 不変条件

- plugin load 前に manifest validation を行う。
- permission 不足時は plugin command / UI action を実行しない。
- plugin UI は `owox` 本体の状態変更 API を直接迂回しない。

## エラー / 例外

- manifest invalid は plugin load failure。
- capability denied は action failure。
- plugin UI mount failure は plugin scoped error として表示する。

## 横断ルール

- plugin 固有 domain は plugin 側に閉じる。
- `owox` 本体は plugin の正本形式を内蔵しない。
- plugin UI host は v0 中核とする。

## 検証観点

- 最小 plugin が command を登録できる。
- 最小 plugin が UI panel を mount できる。
- permission 不足時に command が拒否される。
- official `owl*` plugin を識別できる。

## 関連資料

- `../../requirements/owox/v0/REQ-plugin-host-ui.md`
