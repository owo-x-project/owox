---
id: SPEC-plugin-extension-point
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-plugin-extension-point.md
subproject: owox
---

# Plugin Extension Point

## 概要

v0 最小 plugin extension point の仕様。

## 関連要求

- `REQ-plugin-extension-point`

## 入力

- plugin manifest
- command contribution
- backend hook declaration
- capability / permission declaration

## 出力

- parsed manifest
- registered command contribution
- reserved backend hook boundary
- validation error

## 挙動

- v0 plugin manifest は id、name、version、commands、backend_hooks、capabilities、permissions、ui_panels、settings、dependencies、activation_events を定義または予約する。
- command contribution は command launcher にだけ表示する。
- v0 の plugin command contribution は表示 / 予約のみとし、plugin 任意コード実行 endpoint は持たない。
- v0 は汎用 plugin UI 実行基盤を持たない。
- ui_panels、settings、dependencies、activation_events は将来拡張用に予約し、v0 では実行しない。
- backend hook は lifecycle 名、入力 / 出力、capability check の考え方だけを定義し、v0 では汎用実行基盤を作らない。

## 状態遷移 / 不変条件

- plugin は host capability を明示せずに filesystem、process、network、repo 正本へアクセスしない。
- command contribution は workspace boundary と capability check の設計対象として予約する。
- plugin manifest の予約 field は v0 runtime を不安定にしない。

## エラー / 例外

- manifest parse error は plugin load error とする。
- unsupported reserved field は warning として扱い、実行しない。
- capability / permission 不足時は command を有効化しない。

## 横断ルール

- command launcher は `../../patterns/ux-command-launcher.md` に従う。
- command execution は `SPEC-shared-command-execution.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- manifest の将来 field を parse / ignore できる。
- command contribution が launcher に表示される。
- plugin command contribution の任意コード実行 endpoint が存在しない。
- plugin UI は v0 で実行されない。
- backend hook は境界定義だけで、汎用 hook execution は行われない。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-plugin-extension-point.md`
