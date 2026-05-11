# Project

## Name
owox

## Description
AI Agent First な Terminal Workspace / plugin host。AI CLI、複数 agent、terminal session、diff、preview、logs、approvals、plugin UI を統合する Open Workspace Orchestrator。

現行の Context / Work / Evidence 制御プレーン思想は、公式 plugin `owlcore` として継承する。`owlcore` は server なしで project repo 内 `.owox/owlcore/` に正本を置き、CLI / library / owox plugin として project context、Work Contract、Evidence、Verifier、Policy、Event Log を扱う。

## Language
Japanese

## Kind
monorepo

## Subprojects
- `owox`: Terminal Workspace、plugin host、plugin UI host、agent/session/process 操作面。
- `plugins/owlcore`: 公式 plugin。repo-native context / work / evidence control plane。
- `contracts`: plugin API、schema、repo layout などの外部契約。

## Teams
- `maintainers`: プロジェクト全体の暫定責任境界。実チーム構成は未確定。

## Integrations
- `git-cli`: Git repository、worktree、diff、changed paths を扱うローカル Git CLI。
- `ai-cli`: OpenCode、Claude Code、Codex CLI、Ruflo、Roo Code などの外部 AI coding CLI / Agent。
- `plugin-ui`: plugin 固有 UI を owox 本体へ mount する拡張面。
