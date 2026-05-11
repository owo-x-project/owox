# Task 004 Evidence Verifier Handoff UI

## 目的

Evidence、Verifier result、Acceptance、HandoffRecord を UI で扱う。

## 前提条件

- Task 002
- Task 003
- Phase 06 Task 004

## 作業内容

- Evidence list / detail を作る
- Verifier report 表示を作る
- accept / reject / request revision UI を作る
- HandoffRecord list / detail / refresh UI を作る

## 完了条件

- blocking violation 時に accept できない
- HandoffRecord の integrated / stale が表示できる

## 検証方法

- `cd apps/web && pnpm check`
- `cd apps/web && pnpm build`

## 依存関係

- Task 002
- Task 003
- Phase 06 Task 004

## 成果物

- Evidence / Verifier / Handoff UI
