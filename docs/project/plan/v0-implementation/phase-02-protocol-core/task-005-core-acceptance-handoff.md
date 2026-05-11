# Task 005 Core Acceptance Handoff

## 目的

Verifier 結果、human gate、HandoffRecord の domain command を実装する。

## 前提条件

- Task 004 完了

## 作業内容

- accept / reject / request_revision を実装する
- required evidence missing と blocking violation を拒否する
- handoff create / integrated / stale を実装する

## 完了条件

- verifier_report 不足時に accept できない
- HandoffRecord が `ready_for_merge`, `integrated`, `stale` を扱える

## 検証方法

- `cargo test -p owox-core acceptance`
- `cargo test -p owox-core handoff`

## 依存関係

- Task 004

## 成果物

- acceptance / handoff core commands
