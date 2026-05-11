---
id: ADR-0003-owox-owlcore-product-split
status: 採用
related:
  - docs/project/proposals/active/proposal-owox-owlcore-restructure.md
  - docs/project/architecture.md
  - docs/project/glossary/core.md
---

# owox / owlcore Product Split

## 背景

既存の Owox 資料は、AI CLI、人間、外部ツールが Context、Work Contract、Evidence、Verifier、Policy、Event Log を共有する制御プレーンを中心にしていた。

新方針では、AI Agent First な Terminal Workspace と plugin ecosystem を `owox` 本体にし、既存制御プレーン思想を公式 plugin `owlcore` として継承する。

## 判断

- `owox` は Open Workspace Orchestrator とする。
- `owox` は Terminal Workspace、AI CLI / agent session 操作、plugin host、plugin UI host を担当する。
- `owlcore` は現 Owox の Context / Work / Evidence 制御プレーン思想を継承する公式 plugin とする。
- `owlcore` は完全 serverless とし、必須 runtime は CLI / library / owox plugin とする。
- `owlcore` の project repo 正本は `.owox/owlcore/` に置く。
- 公式 plugin は `owl*` 命名規則を使う。
- plugin 固有 UI は `owox` の中核要件とする。
- v0 は `owox` 本体、v1 は `owlcore`、v2 以降は brand repo / brand context を扱う。

## 代替案

- 現 Owox を制御プレーン名として維持する: 新 `owox` の Terminal Workspace 方針と名称衝突するため不採用。
- `owlcore` を `owox` 内部機能にする: repo-native CLI / library / plugin として独立利用しにくくなるため不採用。
- brand repo を v1 `owlcore` 中核へ含める: v1 の project context / work / evidence だけで十分大きく、scope が肥大化するため不採用。v2 以降に送る。
- `.owlcore/` を repo root に置く: plugin 所有領域が曖昧になるため不採用。`.owox/owlcore/` を採用する。

## 結果

- 既存 architecture、requirements、spec、plan は `owox` 本体と `owlcore` plugin へ分解して更新する。
- 既存 `owoxd` server、HTTP API、WebUI static 配信、OpenCode process 管理の前提は再評価する。
- 旧 `.owox/` layout との互換性は不要。実装前の破壊変更として `.owox/owlcore/` 前提へ切り替える。

## 関連資料

- `../active/ADR-0001-initial-architecture-and-stack.md`
- `../active/ADR-0002-repo-backed-owox-store.md`
- `../../proposals/active/proposal-owox-owlcore-restructure.md`
- `../../architecture.md`
- `../../requirements/index.md`
