---
id: SPEC-crate-owox-git
status: 採用
related:
  - docs/project/integrations/git-cli.md
  - docs/project/specs/shared/SPEC-flow-repo-worktree.md
subproject: crates
---

# owox-git

## 概要

`owox-git` は Git CLI、Managed Repo、task worktree、diff、changed paths、Git 履歴判定を扱う crate。

## 関連要求

- `REQ-repo-worktree-isolation`

## 入力

- repo registration
- work_order_id
- Work Contract paths
- handoff target branch / head commit

## 出力

- worktree
- branch
- diff summary
- changed paths
- history contains result

## 挙動

- branch name は `owox/task/<work_order_id>-<short-slug>`。
- worktree は task 単位で作成する。
- changed paths と diff は accept 前に取得する。
- public API は Ops + Inspect に分ける。
- `GitOps` は repo / worktree / branch 操作を担当する。
- `GitInspect` は changed paths、diff、history contains 判定を担当する。
- external Git service の webhook / provider API は v0 対象外。
- Review Handoff 後の integrated 判定は、handoff head commit が target branch history に含まれるかで推定する。

## Public API

- `GitOps::register_repo(path)`
- `GitOps::create_task_branch(repo, work_order_id, short_slug)`
- `GitOps::create_worktree(repo, branch, worktree_path)`
- `GitOps::remove_worktree(worktree_path)`
- `GitInspect::changed_paths(worktree_path)`
- `GitInspect::diff(worktree_path, format)`
- `GitInspect::head_commit(worktree_path)`
- `GitInspect::fetch(repo, remote)`
- `GitInspect::is_ancestor(repo, ancestor_commit, target_ref)`
- `GitInspect::handoff_integration_status(repo, head_commit, target_ref)`

## 状態遷移 / 不変条件

- AI CLI は main working tree で作業しない。
- merge conflict は `needs_revision`。
- Owox は v0 で PR / MR 作成、review、merge を実装しない。
- Git 履歴判定は projection であり、Owox の acceptance 正本ではない。
- rollback は Git service / Git workflow 側に任せる。Owox は判断 Event と HandoffRecord を残す。

## エラー / 例外

- branch conflict は suffix ULID で回避。
- git command failure は stdout / stderr を Evidence candidate にできる。
- fetch failure は handoff state を確定せず `unknown` diagnostic として返す。
- history contains 判定不能は `GIT_HISTORY_INSPECTION_FAILED`。

## 横断ルール

- DB に依存しない。
- HTTP / Git provider API に依存しない。
- Git 操作結果は Event と Evidence に紐付ける。
- Git command stderr は secret redaction 対象にする。

## 検証観点

- worktree 作成、diff 取得、conflict 検出。
- head commit が target branch history に含まれる場合 integrated と判定できる。
- head commit が古く target branch に含まれない場合 stale と判定できる。
- Git 不在、fetch 失敗、invalid repo を stable error にできる。

## 関連資料

- `../shared/SPEC-flow-repo-worktree.md`
- `../../integrations/git-cli.md`
