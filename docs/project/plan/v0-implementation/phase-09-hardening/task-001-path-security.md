# Task 001 Path Security

## 目的

workspace 外アクセス、path traversal、secret path 変更を拒否する。

## 前提条件

- File / Git / Verifier API が実装済み

## 作業内容

- `..` traversal test を追加する
- symlink escape test を追加する
- forbidden path test を追加する

## 完了条件

- workspace 外アクセスが拒否される
- forbidden path が blocking violation になる

## 検証方法

- `cargo test path_security`

## 依存関係

- Phase 05
- Phase 06

## 成果物

- path security tests
