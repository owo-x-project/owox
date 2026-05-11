# v0 Implementation Plan

## 目的

Owox v0 を実装フェーズへ入れるため、正本化済みの requirements / specs / ADR / validation に基づき、AI エージェントが迷わず着手できる phase と task に分解する。

## 範囲

- contracts / fixtures
- Rust crates
- `.owox/` store
- SQLite projection
- Git worktree / handoff / verifier
- HTTP API / CLI
- WebUI / Manual Outsource
- OpenCode experimental
- MVP hardening

## 対象外

- v1 要件の実装
- Git hosting / CI/CD / deployment service の再実装
- 外部 Git service webhook sync
- 複雑な Policy DSL

## Task 粒度

- 1 task は crate 1つを原則、多くても2つ
- 変更ファイル目安は 1-5 個
- diff 目安は 200-600 行
- public API は 1責務
- test 必須

## 完了定義

- v0 MVP 完成条件に必要な phase がすべて完了する
- `.owox/` 正本から projection rebuild できる
- Work Contract、Evidence、Verifier、HandoffRecord が schema / API / Rust 型で一致する
- Manual Outsource で Work Contract を渡し、Evidence を戻し、Verifier 後に accept / reject / handoff できる

## Phase

- `phase-00-bootstrap/index.md`: repository bootstrap
- `phase-01-contracts-fixtures/index.md`: contracts and fixtures
- `phase-02-protocol-core/index.md`: protocol and pure domain core
- `phase-03-store-layout/index.md`: `.owox/` store and rebuild stream
- `phase-04-db-projection/index.md`: SQLite projection
- `phase-05-git-handoff-verifier/index.md`: Git, HandoffRecord, verifier
- `phase-06-server-cli/index.md`: API server and CLI
- `phase-07-web-manual/index.md`: Workbench and Manual Outsource
- `phase-08-opencode/index.md`: OpenCode experimental adapter
- `phase-09-hardening/index.md`: MVP hardening

## 関連資料

- `../../architecture.md`
- `../../tech-stack.md`
- `../../validation.md`
- `../../specs/index.md`
- `../../requirements/v0/index.md`
