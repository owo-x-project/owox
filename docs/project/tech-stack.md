# 技術スタック

## 目的

このファイルは、採用済み技術を役割単位で記録します。

## 読むべき場面

- 採用技術やバージョン方針を確認したいとき
- 新しい採用判断を記録したいとき

## owox v0

`owox` v0 は WebUI ベース Terminal Workspace / 簡易 IDE の runtime と UI を担当する。

| 技術名 | 採用スタック | バージョン | ADR参照 |
| --- | --- | --- | --- |
| Server language | Rust | major 未固定 | `adr/active/ADR-0002-rust-solid-stack.md` |
| Server framework | Axum | major 未固定 | `adr/active/ADR-0002-rust-solid-stack.md` |
| Async runtime | Tokio | major 未固定 | `adr/active/ADR-0002-rust-solid-stack.md` |
| Frontend language | TypeScript | major 未固定 | `adr/active/ADR-0002-rust-solid-stack.md` |
| Frontend framework | Solid + Vite | major 未固定 | `adr/active/ADR-0002-rust-solid-stack.md` |
| Local metadata DB | SQLite + sqlx | major 未固定 | `adr/active/ADR-0004-sqlite-managed-state.md` |
| Realtime transport | WebSocket | protocol | `adr/active/ADR-0001-owox-owlcore-boundary.md` |
| Terminal renderer | adapter: xterm.js / ghostty-web prototype | adapter 方針固定 | `adr/active/ADR-0003-terminal-renderer-adapter.md` |
| Code editor | CodeMirror 6 | major 6 | `adr/active/ADR-0002-rust-solid-stack.md` |
| Runtime packaging | Docker | major 未固定 | `integrations/docker.md` |

## owlcore v1

`owlcore` v1 は project repo 内 `.owox/owlcore/` を正本にする local / file-based 制御・記録レイヤーを担当する。中央 server、daemon、remote database は採用しない。

| 技術名 | 採用スタック | バージョン | ADR参照 |
| --- | --- | --- | --- |
| Runtime形態 | repo-local file-based mechanism | v1 方針固定 | `adr/active/ADR-0001-owox-owlcore-boundary.md` |
| 正本配置 | `.owox/owlcore/` | v1 方針固定 | `adr/active/ADR-0001-owox-owlcore-boundary.md` |
| Snapshot format | YAML | v1 方針固定 | `adr/active/ADR-0001-owox-owlcore-boundary.md` |
| Append log format | JSONL | v1 方針固定 | `adr/active/ADR-0001-owox-owlcore-boundary.md` |
| Schema validation | 未固定 | prototype / initial implementation で固定 | `requirements/owlcore/v1/REQ-owlcore-repo-native-store.md` |
| CLI adapter候補 | Codex first | v1 方針固定 | `requirements/owlcore/v1/REQ-owlcore-product-scope.md` |
| Database | 採用しない | SQLite / remote DB 非採用 | `adr/active/ADR-0004-sqlite-managed-state.md` |
| Server / daemon | 採用しない | 常駐 runtime 非採用 | `adr/active/ADR-0001-owox-owlcore-boundary.md` |

## バージョン方針

- major はこの表で固定する。
- patch / minor は lockfile で固定する。
- `未固定` の major は prototype / initial implementation で固定する。
- terminal renderer は prototype 結果で default を決める。
- `owlcore` の正本形式は implementation の都合で DB に置き換えない。
