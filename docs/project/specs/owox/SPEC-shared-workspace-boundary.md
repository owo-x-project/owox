---
id: SPEC-shared-workspace-boundary
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
subproject: owox
---

# Workspace Boundary

## 概要

project repo boundary と workspace 内操作境界の横断仕様。

## 関連要求

- `REQ-owox-product-scope`

## 入力

- configured owox workspace root
- selected project path
- repo-relative path
- command cwd

## 出力

- normalized project identity
- validated repo-relative path
- boundary violation error

## 挙動

- v0 は owox workspace root 直下の Git repo を project repo とする。
- project repo の自動検出は workspace root 直下だけを対象にする。
- HTTP API は resource REST style とする。
- project / session / command は server 発行の opaque id で参照する。
- client は host absolute path や project path を resource id として扱わない。
- file、Git、terminal command の cwd は selected project repo 内に制限する。
- project repo をまたぐ上位 context 管理は v0 では扱わない。

## 状態遷移 / 不変条件

- selected project は owox workspace root 直下の Git repo である。
- opaque id は workspace boundary 内の実体に server 側で解決する。
- repo-relative path の正規化後に selected project repo 外へ出てはならない。
- symlink 解決後に boundary 外へ出る path は拒否する。

## エラー / 例外

- boundary 外 path は validation error とする。
- selected project が消えた場合は project unavailable error とする。

## 横断ルール

- boundary violation は secret や host absolute path を過剰に露出しない。
- error display は `SPEC-shared-error-display.md` に従う。
- HTTP API は `SPEC-shared-http-api.md` に従う。

## 検証観点

- workspace root 直下の Git repo だけ project として扱う。
- `..` や symlink で repo boundary を越えられない。
- Git / file / terminal API が selected project repo 外で実行されない。

## 関連資料

- `index.md`
- `../../architecture.md`
- `../../requirements/owox/v0/REQ-owox-product-scope.md`
