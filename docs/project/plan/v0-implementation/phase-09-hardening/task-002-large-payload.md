# Task 002 Large Payload

## 目的

巨大 file、diff、log、request body で Owox が固まらないようにする。

## 前提条件

- File / Diff / Evidence API が実装済み

## 作業内容

- file read size limit を追加する
- diff response size limit を追加する
- request body limit を追加する
- UI error 表示を追加する

## 完了条件

- large file が 413 または controlled error になる
- UI が error を表示できる

## 検証方法

- `cargo test large_payload`
- `cd apps/web && pnpm build`

## 依存関係

- Phase 06
- Phase 07

## 成果物

- large payload guard
