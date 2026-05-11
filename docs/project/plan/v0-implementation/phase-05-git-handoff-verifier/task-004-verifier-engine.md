# Task 004 Verifier Engine

## 目的

固定 rule catalog を実行して VerifierReport を返す。

## 前提条件

- Task 003 完了

## 作業内容

- `VerifierEngine::with_default_rules` を実装する
- `VerifierEngine::run` を実装する
- `verifier_report` Evidence payload を生成できる形にする

## 完了条件

- blocking violation が report に含まれる
- accept を止める判定材料になる

## 検証方法

- `cargo test -p owox-verifier engine`

## 依存関係

- Task 003

## 成果物

- verifier engine
