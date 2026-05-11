---
id: REQ-product-mvp-scope
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/adr/active/ADR-0001-initial-architecture-and-stack.md
---

# MVP の対象範囲と成功条件

## 目標

Owox MVP は、AI 作業の文脈、作業契約、外注、証拠、検収、差分確認を一連の流れとして扱える最小 Workbench を提供する。

## 根拠

Owox の初期価値は、巨大な会社 OS ではなく `Context + Work Contract + AI CLI Session + Evidence + Diff Review` の核を動かすことにある。

## 対象範囲

- Workspace を作成できる。
- Managed Repo を登録できる。
- Raw / Proposed / Official Context を管理できる。
- Context Capsule を作成できる。
- Work Order を作成できる。
- Work Contract を生成できる。
- Manual Outsource で任意 AI に作業を渡せる。
- 初期 AI CLI 連携として OpenCode Session を扱える。
- Task ごとの worktree を作成できる。
- diff を表示できる。
- 軽微修正できる。
- Evidence を登録できる。
- Verifier により scope と evidence を検査できる。
- accept / reject できる。
- Event Log で作業履歴を追える。

## 対象外

- 本格 IDE。
- Git hosting。
- CI/CD 管理。
- deployment 基盤。
- 複数 AI CLI の完全対応。
- Core Coder Agent。
- 大規模 Task Graph。
- Open format の正式公開。
- Company / 子会社モデルの完全版。

## 成功指標

- ユーザーが WebUI から Workspace を作り、repo を登録し、やりたい変更を Work Order として登録できる。
- Owox が Context Capsule と Work Contract を生成し、Manual Outsource または OpenCode に作業を渡せる。
- 作業結果の diff、log、test result などを Evidence として登録できる。
- Verifier が diff scope と必須 Evidence を検査し、ユーザーが accept / reject を判断できる。
- accept / reject と関連 Evidence が Event Log から追跡できる。

## 制約 / 品質条件

- AI の完了報告だけで Done にしない。
- MVP は小さく保ち、後続 phase の機能を先取りしすぎない。
- 実装より先に contract、状態遷移、検収条件を固定する。

## 関連資料

- `../../architecture.md`
- `../../validation.md`
- `../../adr/active/ADR-0001-initial-architecture-and-stack.md`
