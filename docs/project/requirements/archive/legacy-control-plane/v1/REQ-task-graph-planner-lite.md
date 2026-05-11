---
id: REQ-task-graph-planner-lite
status: 提案中
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-work-contract.md
---

# Task Graph / Planner-lite

## 目標

Owox v1 は、Work Order を依存関係付きの小 Task に分解し、並列性、blocker、locked paths、retry policy を管理できる Planner-lite を提供する。

## 根拠

v0 は Work Order 直下の単純な Task / Session 構造に留め、大規模 Task Graph Engine と完全自動 planner を対象外にする。v1 では複数 Task の依存と競合を扱う必要がある。

## 対象範囲

- Work Order 分解を扱う。
- Task dependency を管理する。
- blocked task を検知する。
- parallel task を管理する。
- locked_paths を管理する。
- Task ごとの risk、owner、verifier を扱う。
- retry policy を扱う。

## 対象外

- 完全自動 planner。
- Worker が契約外変更を自己承認する運用。
- 組織全体のスケジューリング最適化。
- 人間判断が必要な分解結果の自動確定。

## 成功指標

- Work Order から複数 Task と依存関係を表現できる。
- blocked / parallelizable / locked_paths が確認できる。
- 並列実行前に path 競合を検出できる。
- retry policy と verifier が Task 単位で追跡できる。

## 制約 / 品質条件

- Work Contract first の方針を維持する。
- Task Graph は Work Contract、worktree、Evidence、Verifier と紐付く。
- Planner-lite は提案と整理を担い、重大判断を自動確定しない。

## 関連資料

- `../v0/REQ-work-contract.md`
- `../v0/REQ-repo-worktree-isolation.md`
- `../../validation.md`
