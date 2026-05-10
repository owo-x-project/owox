---
status: 採用
related:
  - docs/project/specs/web/SPEC-interaction-workbench-review.md
---

# Bounded Workbench Editor

## 目的

Workbench に必要な軽微修正、diff 確認、Session 監視を提供しつつ、本格 IDE の責務を避ける。

## 適用範囲

- Repo Editor
- diff viewer
- file tree
- Git status / apply / revert
- Session Monitor

## 適用しない範囲

- LSP
- debugger
- 汎用拡張機能

## パターン

Workbench editor は review、軽微修正、Git 状態確認、Session 監視の作業台として扱う。interactive CLI は Session Monitor に閉じ、操作は Event に残す。

## 適用条件

- Work Contract / Task / Session に紐付いた作業。
- accept / reject / needs_revision の判断に必要な編集。

## 例外 / 逸脱条件

- 長時間の本格実装や debugger 利用は外部 IDE に委ねる。

## 根拠

v0 は検収と監視の Workbench を必要とするが、外部 IDE を置き換えることは目的ではない。

## 関連資料

- `../specs/web/SPEC-interaction-workbench-review.md`
