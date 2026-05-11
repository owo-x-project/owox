# Shared Specs

## 役割

このディレクトリは、複数の subproject にまたがる仕様を置くための場所です。

## 置いてよいもの

- 共通 API 契約
- 共通状態ルール
- 共通認可や横断要件に関する詳細仕様

## 置いてはいけないもの

- 1 つの subproject に閉じる仕様
- 設計草案や調査メモ

## 命名規則

- `SPEC-<category>-<short-title>.md`

## 参照ルール

- subproject 固有仕様が必要な場合は、対象の `<subproject>/index.md` と個票を追加する

## 参照

- `SPEC-plugin-host.md`: `owox` plugin manifest、permission、command、plugin UI mount
- `SPEC-data-owlcore-layout.md`: `owlcore` の `.owox/owlcore/` repo-native 正本 layout

## 旧 Owox 制御プレーン仕様

- `SPEC-state-context-governance.md`: Context 状態、正式化、Active Context
- `SPEC-data-context-capsule.md`: Context Capsule の構造と生成ルール
- `SPEC-data-work-contract.md`: Work Order、Task Graph Lite、Work Contract revision
- `SPEC-data-owox-layout.md`: 旧 `.owox/` 正本 layout。`SPEC-data-owlcore-layout.md` へ置換対象
- `SPEC-flow-ai-cli-session.md`: Manual Outsource と OpenCode Session lifecycle
- `SPEC-flow-evidence-acceptance.md`: Evidence、Verifier、Acceptance
- `SPEC-flow-repo-worktree.md`: Managed Repo、worktree、Review Handoff、Git 履歴判定
- `SPEC-permission-policy-gate.md`: v0 Policy 固定ルールと violation
- `SPEC-data-event-log.md`: Event Envelope と append-only correction
