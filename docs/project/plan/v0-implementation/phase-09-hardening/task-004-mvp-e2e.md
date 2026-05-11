# Task 004 MVP E2E

## 目的

MVP 完成条件を E2E で確認する。

## 前提条件

- Phase 00-09 の先行 task 完了

## 作業内容

- Workspace / repo / worktree / context / work order / contract / evidence / verifier / accept / handoff の happy path を検証する
- reject / needs_revision / blocking violation の negative path を検証する
- Event Log と projection rebuild を確認する

## 完了条件

- Manual Outsource happy path が通る
- blocking violation が accept を止める
- HandoffRecord が Git 履歴判定で integrated / stale を返す

## 検証方法

- `cargo test --workspace`
- `cd apps/web && pnpm check && pnpm build`
- MVP E2E script

## 依存関係

- Phase 00-09

## 成果物

- MVP E2E validation
