---
id: REQ-repo-management-expansion
status: 提案中
related:
  - docs/project/requirements/v0/REQ-repo-worktree-isolation.md
  - docs/project/integrations/git-cli.md
---

# Repo 管理モードの拡張

## 目標

Owox v1 は、v0 の Managed Repo を拡張し、既存 path を登録する Linked Repo と、必要時 clone する Remote Repo を扱えるようにする。

## 根拠

v0 は Managed Repo を優先し、Remote Repo や Linked Repo の完全対応を対象外にする。v1 では既存開発環境や remote 起点の作業に接続する必要がある。

## 対象範囲

- Linked Repo を登録できる。
- Remote Repo を URL として登録し、必要時 clone できる。
- repo 管理モードごとの権限、path、worktree 作成条件を扱う。
- mode ごとの diff、changed paths、accept 反映先を明確にする。

## 対象外

- Git hosting の内蔵。
- CI/CD 管理。
- deployment 管理。
- 複雑な merge orchestration。

## 成功指標

- Managed Repo、Linked Repo、Remote Repo の違いをユーザーが確認できる。
- Linked Repo でも Task ごとの worktree と diff scope check を使える。
- Remote Repo の clone、worktree、accept 反映の状態を追跡できる。
- mode ごとの危険操作が Policy と Event Log に残る。

## 制約 / 品質条件

- コードの source of truth は Git repo とする。
- AI CLI は引き続き worktree 上で作業する。
- mode 追加により forbidden paths と secret path の制約を弱めない。

## 関連資料

- `../v0/REQ-repo-worktree-isolation.md`
- `../../integrations/git-cli.md`
- `../../validation.md`
