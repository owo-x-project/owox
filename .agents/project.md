# Project

## Name
owox

## Description
Open Workspace Orchestrator。AI Agent First な WebUI ベースの Terminal Workspace / 簡易 IDE。brand 配下の複数 project repo をブラウザから開き、terminal session、agent session、log、Git、file tree、簡易 editor、diff を統合する。

## Language
Japanese

## Kind
monorepo

## Subprojects
- `owox`: WebUI / API server / terminal session / agent session / Git / file tree / editor / diff / log 操作面。
- `plugins/owlcore`: v1 公式 plugin。project repo 内 `.owox/owlcore/` を使う repo-native context / work / evidence control plane。

## Teams
- `maintainers`: プロジェクト全体の暫定責任境界。実チーム構成は未確定。

## Integrations
- Docker
- External AI CLI
