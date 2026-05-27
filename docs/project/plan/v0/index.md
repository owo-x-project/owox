# owox v0 Implementation Plan

## 目的

現行 `owox` v0 requirement / spec を、実装可能で検証可能な phase と task に分解し、browser から利用できる WebUI ベース Terminal Workspace / 簡易 IDE を完全実装する。

## スコープ

- owox workspace root 直下の project repo 発見、一覧、workspace 切替。
- HTTP API、WebSocket event、workspace boundary、command execution、error display、destructive confirmation。
- SQLite managed metadata による project / session / log / UI state 管理。
- terminal session の起動、入出力、終了、resize、log、reconnect。
- file tree、簡易 editor、diff view、log view。
- VS Code 標準 Source Control 相当の Git workflow。
- PC / tablet / smartphone の responsive 同等操作。
- plugin manifest、command contribution、backend hook 予約。
- Docker セルフホスト運用と外部 AI CLI を任意 command として扱う導線。

## 非スコープ

- AI CLI 固有 adapter / agent runtime。
- agent CLI ごとの特殊 UI。
- 外部仕様管理、作業契約、証拠正本化、検収自動化。
- team / multi-user 権限管理。
- Git hosting / CI/CD / deployment service の再実装。
- LSP、debugger、複雑な merge conflict editor。
- 汎用 plugin UI 実行基盤、marketplace、remote plugin distribution。

## 前提

- 優先軸は「基盤契約先行 + 完全実装を縦切りで積む」。HTTP / WebSocket / workspace boundary / DB / command execution を先に固定し、その後主要機能を完成させる。
- task 粒度は 1 セッション単位。
- 検証は単体重視。v0 release 判定は最短到達を優先し、phase 完了時に必要最小限の integration / browser smoke / 手動 checklist を追加する。
- terminal renderer は adapter 境界を先に作り、xterm.js / ghostty-web prototype 比較結果で default を決める。
- v0 は個人セルフホスト前提。権限管理は workspace boundary と destructive confirmation に限定する。

## 完了定義

- ユーザーが browser から project workspace を開き、terminal session と任意 command としての AI CLI を起動、監視、終了できる。
- browser reload 後に terminal session / log を再表示できる。
- file tree、簡易 editor、diff view、log view、Git 操作が同じ workspace 内で使用できる。
- Git status / diff / stage / unstage / discard / commit / branch / fetch / pull / push / sync が WebUI から実行でき、失敗と破壊的操作が仕様どおり表示される。
- PC / tablet / smartphone で主要操作が完了し、操作不可領域や破綻した重なりがない。
- plugin manifest、command contribution、backend hook の予約境界があり、v0 core が plugin 固有 domain を内蔵しない。
- unit test が主要 contract / service / UI state を覆い、v0 の最小 release smoke と手動 checklist が通る。

## フェーズ一覧

- `phase-01-foundation-contracts/index.md`: 基盤 contract、DB、workspace boundary、API / WebSocket / command execution を固定する。
- `phase-02-workspace-files-ui/index.md`: project list、workspace shell、file tree、editor、log view の基本 UI を作る。
- `phase-03-terminal-log-runtime/index.md`: PTY / process、terminal renderer adapter、log、reconnect を完成させる。
- `phase-04-git-diff-workflow/index.md`: Git workflow と diff view を完成させる。
- `phase-05-responsive-integration/index.md`: responsive 同等操作、error / confirmation の横断統合、主要 workflow 統合を完成させる。
- `phase-06-plugin-packaging-release/index.md`: plugin extension point、Docker packaging、release validation を完成させる。

## 依存関係

- `../../architecture.md`
- `../../tech-stack.md`
- `../../validation.md`
- `../../requirements/owox/v0/index.md`
- `../../specs/owox/index.md`
- `../../adr/active/ADR-0002-rust-solid-stack.md`
- `../../adr/active/ADR-0003-terminal-renderer-adapter.md`
- `../../adr/active/ADR-0004-sqlite-managed-state.md`
- `../../integrations/docker.md`
- `../../integrations/external-ai-cli.md`
- `../../patterns/index.md`

## 検証方針

- Contract / service / reducer / parser / command wrapper は unit test を優先する。
- workspace boundary、command execution、Git operation、terminal lifecycle は壊れやすい境界だけ fixture integration test を置く。
- responsive 同等操作は代表 viewport の最小 browser smoke と手動 checklist で確認する。
- Docker / external AI CLI は fake command と container smoke の最小導線で確認する。
- 仕様外 domain を core に入れていないことを release 前 review で確認する。

## 未確定事項

- terminal renderer の default 選定は `phase-03-terminal-log-runtime` 内で prototype 比較後に決める。
- destructive operation の確認 UI 文言と二段階確認範囲は `phase-05-responsive-integration` で最終調整する。
- v0 release 判定は最短 release を優先し、browser E2E を増やす判断は v0 後続 task に分離する。
