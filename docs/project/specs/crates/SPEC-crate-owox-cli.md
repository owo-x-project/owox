---
id: SPEC-crate-owox-cli
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/specs/crates/SPEC-crate-owox-server.md
subproject: crates
---

# owox-cli

## 概要

`owox-cli` は `owoxd` binary と command 実装を持つ crate。daemon 起動、workspace 初期化、診断を担当し、domain logic は `owox-core`、HTTP/API は `owox-server` に委譲する。

## 関連要求

- `REQ-product-mvp-scope`
- `REQ-repo-worktree-isolation`
- `REQ-policy-event-audit`

## 入力

- CLI args
- environment variables
- workspace path
- config path

## 出力

- process exit code
- stdout / stderr
- `owoxd serve` runtime
- `owoxd doctor` diagnostic result

## 挙動

- `owoxd` は `owox-cli` crate の binary として定義する。
- v0 command は `init`, `serve`, `doctor` を持つ。
- `serve` は `owox-server` の router / runtime を起動する。
- `init` は workspace と `.owox/` 初期 layout の作成を呼び出す。
- `doctor` は Git availability、workspace layout、DB projection、schema fixture の基本状態を確認する。
- tracing 初期化を行う。

## 状態遷移 / 不変条件

- CLI は DB row や `.owox/` file を直接組み立てない。
- CLI は command 境界として schema validation を呼ぶ。
- destructive な repair は v0 では提供しない。

## エラー / 例外

- invalid args は clap の exit code に従う。
- workspace 不正は stable code `CLI_WORKSPACE_INVALID`。
- server 起動失敗は stable code `CLI_SERVER_START_FAILED`。
- doctor failure は診断項目ごとに failed / warning を返す。

## 横断ルール

- CLI integration test は `assert_cmd` を使う。
- daemon port、workspace path、log level は CLI args または env で指定できる。
- `owox-cli` は WebUI 配信実装を持たず、server に委譲する。

## 検証観点

- `owoxd --help` が成功する。
- `owoxd init` が `.owox/` 初期 layout を作る。
- `owoxd serve` が health endpoint を返せる。
- `owoxd doctor` が Git 不在、workspace 不正を検出できる。

## 関連資料

- `SPEC-crate-owox-server.md`
- `../../architecture.md`
