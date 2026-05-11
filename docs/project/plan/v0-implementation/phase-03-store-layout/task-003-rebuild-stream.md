# Task 003 Rebuild Stream

## 目的

`.owox/` 正本から DB projection 用 rebuild stream を生成する。

## 前提条件

- Task 002 完了

## 作業内容

- snapshot / events / index を順序付きで読む
- HandoffRecord を rebuild stream に含める
- integrity mismatch を検出する

## 完了条件

- fresh clone fixture から rebuild stream を生成できる
- Event / snapshot 不整合を検出できる

## 検証方法

- `cargo test -p owox-store rebuild`

## 依存関係

- Task 002

## 成果物

- store rebuild stream
