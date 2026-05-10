---
id: SPEC-interaction-workbench-review
status: 採用
related:
  - docs/project/requirements/v0/REQ-workbench-review.md
  - docs/project/specs/contracts/SPEC-api-v0-contracts.md
subproject: web
---

# Workbench Review Interaction

## 概要

Workbench は作業状況、Context、Session、diff、Evidence を確認し、軽微修正と検収判断を行う UI。

## 関連要求

- `REQ-workbench-review`

## 入力

- Work Order
- Context Proposal
- Session log / status
- diff / file tree
- Evidence / Verifier result

## 出力

- patch / file edit
- accept / reject / needs_revision command
- Context Proposal command
- Session control command

## 挙動

- MVP 画面は Home / CEO Desk、Work Orders、Context、Sessions、Evidence、Repo Editor、Session Monitor。
- Repo Editor は file tree、複数 file 編集、Git 操作、git status、diff、apply/revert を扱う。
- Repo Editor は LSP、debugger を扱わない。
- Session Monitor は OpenCode log streaming、status、cancel、retry、result import、interactive input を扱う。
- review decision flow は Diff 先。diff 確認を主導線にし、Evidence / Verifier result を参照して accept / reject / needs_revision する。

## 状態遷移 / 不変条件

- accept / reject / needs_revision は理由を要求する。
- Verifier blocking violation がある場合、accept UI は実行不可にする。
- UI は Policy / Verifier result を隠して accept させない。

## エラー / 例外

- Session stream 切断時は再接続または failed 状態を表示する。
- file edit が forbidden path に触れる場合は apply 前に拒否する。

## 横断ルール

- WebUI は API command endpoint を通じて状態変更する。
- UI 上の編集結果は Evidence / diff として追跡可能にする。

## 検証観点

- 判断待ち、高リスク変更、検収待ち、失敗 Session、Context Proposal を確認できる。
- diff から Evidence と Verifier result へ辿れる。
- interactive CLI 操作が Session Event に残る。

## 関連資料

- `../../requirements/v0/REQ-workbench-review.md`
