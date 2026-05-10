---
id: REQ-repo-worktree-isolation
status: 採用
related:
  - docs/project/integrations/git-cli.md
  - docs/project/architecture.md
---

# Repo と Worktree による作業隔離

## 目標

Owox は、管理下 repo と Task ごとの worktree を分離し、AI CLI 作業の安全性、並列性、検収性を確保する。

## 根拠

AI CLI に main working tree を直接触らせると、repo 破壊、scope 外変更、競合、rollback 困難が起きる。Task ごとに worktree を分けることで、変更範囲と検収対象を明確にできる。

## 対象範囲

- MVP では Managed Repo を優先し、Owox Workspace 配下に repo を登録する。
- Task ごとに worktree を作成する。
- AI CLI は worktree 上で作業する。
- diff と changed paths を worktree から取得し、Verifier に渡す。
- accept された変更だけ repo へ反映する。

## 対象外

- Git hosting の内蔵。
- CI/CD 管理。
- deployment 管理。
- Remote Repo や Linked Repo の完全対応。
- 複雑な merge orchestration。

## 成功指標

- repo を Owox Workspace に登録できる。
- Task ごとに独立した worktree を作成できる。
- worktree の changed paths と diff を取得できる。
- reject または失敗時に worktree を破棄または隔離できる。
- accept 時に変更を repo へ反映できる。

## 制約 / 品質条件

- コードの source of truth は Git repo とする。
- 作業理由、Context、Work Order、Evidence、検収結果、Event Log の source of truth は Owox とする。
- worktree 操作は Work Contract の allowed paths / forbidden paths と連動する。

## 関連資料

- `../../integrations/git-cli.md`
- `../../architecture.md`
- `../../validation.md`
