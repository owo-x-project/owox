---
status: 採用
related:
  - docs/project/specs/owox/SPEC-plugin-extension-point.md
  - docs/project/specs/owox/SPEC-shared-command-execution.md
subproject: owox
---

# Command Launcher

## 目的

workspace 操作、Git 操作、plugin command contribution を command launcher から扱う導線を統一する。

## 適用範囲

- workspace 操作
- terminal 作成
- Git 操作
- plugin command contribution の表示 / 予約

## 適用しない範囲

- AI CLI 固有 adapter。
- agent CLI ごとの特殊 UI。
- marketplace 検索。

## パターン

- command launcher は v0 必須の shell 操作入口とする。
- command launcher は上から開く modal palette とする。
- fuzzy search、category 表示、danger indicator を持つ。
- keyboard と touch の両方で操作できる。
- command は workspace boundary と permission / capability を確認してから実行する。
- plugin command contribution は host 側 command list に統合する。
- v0 では plugin command contribution の表示 surface は command launcher のみにする。
- v0 では plugin command contribution の任意コード実行は行わない。

## 適用条件

- navigation より速く操作を呼び出したい場合。
- UI 上の場所に依存しない操作入口が必要な場合。

## 例外 / 逸脱条件

- 破壊的操作は launcher から直接確定せず、destructive confirmation を経る。
- plugin UI panel を launcher から直接開く挙動は v0 では扱わない。
- plugin command contribution を launcher から実行する挙動は v0 では扱わない。
- dangerous command は danger indicator を表示し、実行前に confirmation flow へ渡す。

## 根拠

- shell 型 UI では launcher が横断操作入口になる。
- v0 plugin extension point の command contribution を UI に載せる最小 surface になる。

## 関連資料

- `../specs/owox/SPEC-plugin-extension-point.md`
- `../specs/owox/SPEC-shared-command-execution.md`
