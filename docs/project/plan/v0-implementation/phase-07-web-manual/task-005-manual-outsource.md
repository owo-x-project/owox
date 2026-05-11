# Task 005 Manual Outsource

## 目的

Work Contract を外部 AI へ渡し、Evidence を戻す手動外注 flow を作る。

## 前提条件

- Task 002
- Task 004

## 作業内容

- prompt export を作る
- Evidence import form を作る
- imported Evidence から verifier run へ進める UI を作る

## 完了条件

- prompt に objective / context / allowed paths / required evidence が含まれる
- Evidence import 後に verifier を実行できる

## 検証方法

- `cd apps/web && pnpm check`
- `cd apps/web && pnpm build`

## 依存関係

- Task 002
- Task 004

## 成果物

- Manual Outsource flow
