# Core Glossary

このファイルは、プロジェクト全体で必読となる共通用語を置きます。

## owox

Open Workspace Orchestrator。AI Agent First な Terminal Workspace / plugin host。複数 AI agent、AI CLI、terminal session、diff、file tree、簡易 editor、preview、logs、approvals、plugin UI を扱う実行・操作面。

## owlcore

現 Owox の Context / Work / Evidence 制御プレーン思想を継承する公式 `owox` plugin。server なしで project repo 内 `.owox/owlcore/` を正本とし、project context、Work Order、Work Contract、Evidence、Verifier、Policy、Event Log を扱う。

## owox plugin

`owox` に機能、command、schema、UI、外部 tool 連携を追加する拡張単位。公式 plugin は `owl*` 命名規則を使う。

## Plugin UI

plugin が `owox` 本体に追加する固有 UI。`owox` 本体は mount、routing、panel、permission、command integration を提供し、plugin は自分の責務に閉じた UI を提供する。

## Brand Repo

ブランド固有 context を持つ Git repository。v2 以降の追加機能候補。project repo 作業時に brand context をどう注入するかは `owox` orchestration の責務候補であり、`owlcore` v1 の中核には含めない。

## Context

AI Agent や人間が作業判断に使う文脈情報。Raw、Proposed、Official の状態を分け、Official だけを継続参照する。

## Work Contract

`owlcore` が AI CLI や人間に渡す作業契約。目的、許可パス、禁止パス、必要文脈、期待成果物、必須 Evidence、受け入れ条件を含む。

## Evidence

作業完了を検収するための証拠。diff、ログ、テスト結果、成果物、確認記録などを含む。

## Verifier

Work Contract と Evidence に基づき、scope、policy、必須証拠、テスト結果、契約準拠を検査する仕組み。

## Official Context

Review や Policy Gate を通過し、正本として継続参照してよい文脈。
