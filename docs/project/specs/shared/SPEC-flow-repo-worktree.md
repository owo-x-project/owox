---
id: SPEC-flow-repo-worktree
status: 採用
related:
  - docs/project/requirements/v0/REQ-repo-worktree-isolation.md
  - docs/project/adr/active/ADR-0002-repo-backed-owox-store.md
---

# Repo Worktree Isolation

## 概要

Managed Repo は workspace 内 clone として扱い、Task ごとの worktree で AI CLI 作業を隔離する。

## 関連要求

- `REQ-repo-worktree-isolation`

## 入力

- Managed Repo registration
- Task
- Work Contract paths
- accept command

## 出力

- worktree
- changed paths
- diff
- merge commit
- Event

## 挙動

- Managed Repo は Owox Workspace 配下に clone して登録する。
- project 由来の Owox 正本は repo 内 `.owox/` に置く。
- `.owox/` layout は `contexts`, `work-orders`, `tasks`, `contracts`, `sessions`, `evidence`, `events`, `policies` の entity 別 directory。
- Task ごとに worktree を作成する。
- accepted 変更は merge commit により repo へ反映する。

## 状態遷移 / 不変条件

- AI CLI は main working tree ではなく task worktree で作業する。
- worktree diff は accept 前に Verifier へ渡す。
- reject / failed worktree は破棄または隔離し、Event に残す。

## エラー / 例外

- forbidden path 変更を含む worktree は merge 不可。
- base repo と worktree の merge conflict は needs_revision。

## 横断ルール

- SQLite は projection/cache であり、repo / `.owox/` 正本から再構築可能にする。
- Git 操作結果は Event と Evidence に紐付ける。

## 検証観点

- worktree changed paths が取得できる。
- merge commit 前に verifier check が走る。
- `.owox/` 正本から projection を再構築できる。

## 関連資料

- `../../requirements/v0/REQ-repo-worktree-isolation.md`
- `../../adr/active/ADR-0002-repo-backed-owox-store.md`
