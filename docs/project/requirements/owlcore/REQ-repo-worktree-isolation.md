---
id: REQ-repo-worktree-isolation
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-owlcore-product-scope.md
  - docs/project/requirements/owlcore/v1/REQ-work-contract.md
  - docs/project/requirements/owlcore/v1/REQ-evidence-verification.md
---

# Repo and Worktree Isolation

## 目標

`owlcore` は project repo と task worktree を分離し、AI CLI 作業の変更範囲、Evidence、Verifier 検査を安全に扱う。

## 根拠

AI CLI に main working tree を直接触らせると、scope 外変更、競合、rollback 困難、検収不能が起きる。worktree と Work Contract を紐付けることで、変更対象と検収対象を明確にできる。

## 対象範囲

- project repo を `owlcore` 管理対象として扱う。
- Work Order / Work Contract に紐づく worktree を扱う。
- AI CLI 作業は worktree 上で行う。
- changed paths と diff を取得する。
- allowed paths / forbidden paths と diff scope を Verifier に渡す。
- worktree、diff、検査結果を Evidence / Event Log に紐付ける。
- `.owox/owlcore/` に repo / worktree 関連 metadata を保存する。

## 対象外

- Git hosting の内蔵。
- CI/CD 管理。
- deployment 管理。
- PR / MR 作成、review、merge の再実装。
- `owox` の terminal process 起動 UI。

## 成功指標

- Work Contract ごとに作業対象 worktree を追跡できる。
- worktree の changed paths と diff を取得できる。
- forbidden path 変更を accept 前に検出できる。
- reject / failed の作業結果を Event Log から追跡できる。

## 制約 / 品質条件

- コード成果物の source of truth は Git repo。
- `owlcore` の文脈、契約、証拠、検収結果の source of truth は `.owox/owlcore/`。
- Git provider API に依存しない。

## 関連資料

- `REQ-owlcore-product-scope.md`
- `REQ-work-contract.md`
- `REQ-evidence-verification.md`
