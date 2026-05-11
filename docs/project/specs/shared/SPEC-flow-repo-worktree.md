---
id: SPEC-flow-repo-worktree
status: 採用
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-repo-worktree-isolation.md
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
- HandoffRecord
- Git history integration status
- Event

## 挙動

- Managed Repo は Owox Workspace 配下に clone して登録する。
- project 由来の Owox 正本は repo 内 `.owox/` に置く。
- `.owox/` layout は `SPEC-data-owox-layout` に従う。
- Task ごとに worktree を作成する。
- branch name は `owox/task/<work_order_id>-<short-slug>`。
- worktree path は Owox workspace 内 `worktrees/<repo_id>/<work_order_id>`。
- accept 前に changed paths、diff、required evidence、policy violation を Verifier へ渡す。
- PR / merge review / merge は GitHub / GitLab / Gitea など外部 Git service に任せる。
- Owox は v0 で PR / MR 作成、review、merge、webhook state sync を実装しない。
- Owox は worktree 検証、Evidence、acceptance decision、accepted Event、HandoffRecord を正本化する。
- HandoffRecord は target branch と head commit を持つ。
- merge 済み判定は head commit が target branch history に含まれるかで推定する。

## 状態遷移 / 不変条件

- AI CLI は main working tree ではなく task worktree で作業する。
- worktree diff は accept 前に Verifier へ渡す。
- reject / failed worktree は破棄または隔離し、Event に残す。
- accepted 後の `.owox/` 更新は code change と同じ Git 履歴上で追跡可能にする。
- `accepted` は Owox の Evidence / Verifier / human gate 通過を意味し、外部 merge 完了ではない。
- HandoffRecord state は `ready_for_merge`, `integrated`, `stale`。
- Git trace marker `Owox-Decision: <id>` は PR / MR 本文案や merge commit 例に含められるが必須ではない。

## エラー / 例外

- forbidden path 変更を含む worktree は accept 不可。
- base repo と worktree の merge conflict は needs_revision。
- branch 名衝突は suffix ULID を付けて回避する。
- Git fetch / history 判定失敗は HandoffRecord state を確定せず diagnostic として返す。
- branch protection / CI failure は外部 Git service の責務であり、Owox は PR / MR state として正本化しない。

## 横断ルール

- SQLite は projection/cache であり、repo / `.owox/` 正本から再構築可能にする。
- Git 操作結果は Event と Evidence に紐付ける。
- 外部 Git service の機能を再実装しない。
- Git 履歴のみを provider 非依存 projection として使う。

## 検証観点

- worktree changed paths が取得できる。
- accept 前に verifier check が走る。
- `.owox/` 正本から projection を再構築できる。
- HandoffRecord の head commit が target branch history に含まれる場合 integrated と判定できる。

## 関連資料

- `../../requirements/archive/legacy-control-plane/v0/REQ-repo-worktree-isolation.md`
- `../../adr/active/ADR-0002-repo-backed-owox-store.md`
- `SPEC-data-owox-layout.md`
