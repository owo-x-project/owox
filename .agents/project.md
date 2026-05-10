# Project

## Name
Owox

## Description
AI Agent、AI coding CLI、人間、外部ツールが、必要最小限の文脈、作業契約、証拠、検収結果を共有しながら作業するためのセルフホスト型 Context / Work / Evidence 制御プレーン。

## Language
Japanese

## Kind
monorepo

## Subprojects
- `crates`: Rust daemon、domain core、DB、Git、verifier、server、CLI、testkit。
- `web`: SvelteKit static build の WebUI。
- `contracts`: OpenAPI と JSON Schema による外部契約。

## Teams
- `maintainers`: プロジェクト全体の暫定責任境界。実チーム構成は未確定。

## Integrations
- `git-cli`: Git repository、worktree、diff、changed paths を扱うローカル Git CLI。
- `ai-cli`: OpenCode、Claude Code、Codex CLI、Ruflo、Roo Code などの外部 AI coding CLI / Agent。
