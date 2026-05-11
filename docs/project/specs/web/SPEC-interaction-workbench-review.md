---
id: SPEC-interaction-workbench-review
status: 採用
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-workbench-review.md
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

## Component contract

- `WorkOrderList`
  - state: `loading`, `empty`, `ready`, `error`, `forbidden`
  - operation: select, filter, create command
  - disabled: create は repo 未登録時 disabled
- `ContextReviewPanel`
  - state: `loading`, `proposed`, `official`, `rejected`, `error`
  - operation: approve, reject, archive
  - disabled: Official 直接編集、policy blocking 中の approve
- `SessionMonitor`
  - state: `idle`, `running`, `input_required`, `stream_disconnected`, `failed`, `cancelled`, `submitted`
  - operation: send input, cancel, retry, import result
  - disabled: `running` 以外の cancel、`running` 中の retry、contract revision なしの start
- `DiffReview`
  - state: `loading`, `no_changes`, `ready`, `policy_blocked`, `error`
  - operation: file select, evidence link open, verifier run
  - disabled: diff 未取得時の accept、policy blocking 中の accept
- `EvidenceChecklist`
  - state: `missing`, `partial`, `complete`, `invalid`
  - operation: register evidence, open artifact, rerun verifier
  - disabled: invalid artifact、secret path hit
- `DecisionBar`
  - state: `draft`, `verifying`, `ready`, `blocked`, `submitting`
  - operation: accept, reject, needs_revision
  - disabled: reason 未入力、blocking violation、required evidence missing、人間 actor 不明
- `RepoEditor`
  - state: `clean`, `dirty`, `conflicted`, `forbidden_path`, `error`
  - operation: edit, save, revert file, view status
  - disabled: forbidden path、conflict 未解決、read-only actor

## エラー表示

- API typed error は `code`, `message`, `violations`, `request_id` を表示できる形で保持する。
- blocking violation は action 近傍と Verifier summary の両方に出す。
- stream 切断は SessionMonitor 内で再接続可能状態として出す。
- 権限不足は forbidden state として空表示にしない。

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
- 画面は component contract の組み合わせとして定義する。
- 権限、policy、状態遷移による disabled 条件は button 表示だけでなく command 実行前にも検査する。

## 検証観点

- 判断待ち、高リスク変更、検収待ち、失敗 Session、Context Proposal を確認できる。
- diff から Evidence と Verifier result へ辿れる。
- interactive CLI 操作が Session Event に残る。
- 各 component の loading / empty / ready / error / forbidden を fixture で表示確認できる。
- blocking violation 時に accept が disabled になる。

## 関連資料

- `../../requirements/archive/legacy-control-plane/v0/REQ-workbench-review.md`
