# Task 001: App Scaffold

## 目的

`owox` v0 の Rust server、Solid client、shared contract の最小実行単位を作る。

## 前提条件

- `../../index.md` の技術スタック前提が有効。
- 既存 repo 構成を確認し、不要な構成変更を避ける。

## 作業内容

- Axum server entrypoint、health endpoint、config loading、logging を追加する。
- Solid + Vite client shell、API client の配置、開発サーバ接続設定を追加する。
- server / client の型共有または schema 生成方針を実装可能な形に固定する。
- formatter、lint、test command を整備する。

## 完了条件

- server と client がローカルで起動する。
- health endpoint が成功する。
- CI 相当の format / lint / unit test の入口がある。

## 検証方法

- server unit test。
- client typecheck。
- health endpoint smoke。

## 依存関係

- `../index.md`
- `../../../tech-stack.md`
- `../../../adr/active/ADR-0002-rust-solid-stack.md`

## 成果物

- server scaffold。
- client scaffold。
- 開発・検証 command。
