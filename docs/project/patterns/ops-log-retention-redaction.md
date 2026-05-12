---
status: 採用
related:
  - docs/project/validation.md
subproject: owox
---

# Log Retention Redaction

## 目的

terminal log、operation log、Git failure log の保持と secret redaction 方針を統一する。

## 適用範囲

- terminal output log
- operation log
- Git failure log

## 適用しない範囲

- secret の完全検出保証。
- v1 `owlcore` Evidence の正本保持方針。

## パターン

- terminal output は保存前に既知 secret pattern を redaction する。
- raw secret を docs、log、`.owox/owlcore/` に保存しない。
- workspace 全体の log 容量上限を持つ。
- session log は手動削除できる。
- redaction 済みであることを metadata に残す。

## 適用条件

- terminal、Git、process、filesystem 操作の出力を保存する場合。

## 例外 / 逸脱条件

- 未知 secret の検出は保証しない。
- redaction で実行結果の解析が困難になる場合でも raw secret は保存しない。

## 根拠

- v0 は個人セルフホストでも provider key や credential の漏洩を避ける。
- terminal output は大きくなりやすいため容量上限と手動削除が必要である。

## 関連資料

- `../validation.md`
