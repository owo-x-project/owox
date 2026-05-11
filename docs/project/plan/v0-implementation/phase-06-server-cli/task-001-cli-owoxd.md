# Task 001 CLI owoxd

## 目的

`owoxd` binary と `init`, `serve`, `doctor` command を実装する。

## 前提条件

- Phase 00 完了
- `SPEC-crate-owox-cli`

## 作業内容

- clap command を実装する
- `owoxd --help` を実装する
- `init`, `serve`, `doctor` の skeleton を実装する

## 完了条件

- `owoxd --help` が成功する
- 未実装ではなく command skeleton が存在する

## 検証方法

- `cargo test -p owox-cli`

## 依存関係

- Phase 00

## 成果物

- owoxd CLI
