# Task 001 Monorepo Skeleton

## 目的

Owox v0 の crate、WebUI、contracts、examples を置く最小 monorepo skeleton を作る。

## 前提条件

- Rust toolchain が利用できる
- Node.js と pnpm 10 が利用できる

## 作業内容

- root `Cargo.toml` を作成する
- `crates/owox-protocol`, `owox-core`, `owox-store`, `owox-db`, `owox-git`, `owox-verifier`, `owox-server`, `owox-cli`, `owox-testkit` を作成する
- `apps/web`, `contracts`, `examples` を作成する
- 各 crate に最小 `lib.rs` または binary entrypoint を置く

## 完了条件

- `cargo metadata` が成功する
- `cargo check` が成功する
- `apps/web` が pnpm workspace に含まれる

## 検証方法

- `cargo metadata`
- `cargo check`

## 依存関係

- なし

## 成果物

- monorepo skeleton
