---
status: 採用
related:
  - docs/project/specs/owox/SPEC-shared-workspace-boundary.md
subproject: owox
---

# Workspace Boundary API

## 目的

project repo boundary 内で API / command / filesystem 操作を扱う共通境界を定義する。

## 適用範囲

- project detection
- file tree / editor file operation
- terminal command cwd
- Git command cwd

## 適用しない範囲

- project repo をまたぐ上位 context 管理。
- repo 外 allowlist path。

## パターン

- owox workspace root 直下の Git repo を project repo とする。
- HTTP API は resource REST style とする。
- project / session / command は server 発行の opaque id で参照する。
- API 入力は repo-relative path を受け取り、server 側で正規化する。
- 正規化後に selected project repo 外へ出る path は拒否する。
- command cwd は selected project repo 内に制限する。

## 適用条件

- filesystem、Git、terminal command が selected project に作用する場合。

## 例外 / 逸脱条件

- v0 では repo 外 path を許可しない。
- host absolute path を client resource id として露出しない。
- project repo をまたぐ上位 context 管理は別 requirement / spec で扱う。

## 根拠

- v0 は個人セルフホストでも host filesystem への過剰アクセスを避ける。
- project repo boundary は Git、file、terminal の共通安全境界である。

## 関連資料

- `../specs/owox/SPEC-shared-workspace-boundary.md`
