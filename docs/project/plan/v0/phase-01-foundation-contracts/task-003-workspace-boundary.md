# Task 003: Workspace Boundary

## 目的

owox workspace root と project repo boundary を server 側で強制する。

## 前提条件

- DB repository の project metadata 境界がある。
- workspace root 設定が読み込める。

## 作業内容

- workspace root 直下の Git repo discovery を実装する。
- path canonicalization と traversal 防止を実装する。
- command cwd、file access、Git operation が project repo boundary 内に収まることを検証する。

## 完了条件

- workspace root 外 path が拒否される。
- 直下 Git repo のみ project repo として扱われる。
- boundary violation が仕様どおり error envelope になる。

## 検証方法

- temp directory fixture unit test。
- traversal / symlink / missing repo の negative test。

## 依存関係

- `task-002-sqlite-managed-metadata.md`
- `../../../specs/owox/SPEC-shared-workspace-boundary.md`
- `../../../patterns/api-workspace-boundary.md`

## 成果物

- workspace boundary service。
- project discovery service。
- boundary test。
