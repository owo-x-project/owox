---
id: SPEC-crate-owox-testkit
status: 採用
related:
  - docs/project/validation.md
  - docs/project/specs/contracts/SPEC-json-schema-v0.md
  - docs/project/specs/shared/SPEC-data-owox-layout.md
subproject: crates
---

# owox-testkit

## 概要

`owox-testkit` は crate tests と integration tests が共有する fixture / temporary environment を提供する crate。production code の責務を持たない。

## 関連要求

- `REQ-product-mvp-scope`
- `REQ-evidence-verification`
- `REQ-repo-worktree-isolation`
- `REQ-policy-event-audit`

## 入力

- contract fixture path
- test scenario definition
- fixed clock / ID seed

## 出力

- loaded JSON fixture
- temp `.owox/` repo
- temp Git repo / worktree
- fixed `CommandContext`
- assertion helper

## 挙動

- contract fixture loader を提供する。
- `contracts/fixtures/v0/{valid,invalid}/` の JSON Schema fixture を読み込める。
- `examples/` は人間向けサンプルとして扱い、fixture 正本としては読まない。
- temp `.owox/` repo を作成する。
- Git repo / worktree fixture を作成する。
- fixed clock / ID generator を提供する。
- production crate から依存されない。

## 状態遷移 / 不変条件

- testkit が生成する `.owox/` layout は `SPEC-data-owox-layout` に従う。
- testkit が生成する payload は v0 schema に従う。
- fixture は契約先行で管理し、実装都合で schema と乖離させない。

## エラー / 例外

- fixture 不正は test failure として扱う。
- Git fixture 作成失敗は skip ではなく failure にする。ただし Git 不在を明示できる helper を提供する。
- temp path escape は testkit 内で拒否する。

## 横断ルール

- `owox-testkit` は dev-dependency 専用。
- `owox-protocol`, `owox-core`, `owox-store`, `owox-db`, `owox-git`, `owox-verifier`, `owox-server`, `owox-cli` の tests から利用できる。
- fixture は `contracts/fixtures/v0/` を正本として扱う。
- `examples/` との一致は任意の documentation check とし、contract test の正本にしない。

## 検証観点

- fixed clock / ID generator により deterministic snapshot test ができる。
- temp `.owox/` repo から store rebuild test ができる。
- Git worktree fixture で changed paths / diff / history contains 判定を検証できる。
- invalid schema fixture が validation error になる。

## 関連資料

- `../../validation.md`
- `../contracts/SPEC-json-schema-v0.md`
- `../shared/SPEC-data-owox-layout.md`
