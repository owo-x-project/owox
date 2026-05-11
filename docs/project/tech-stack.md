# 技術スタック

## 目的

このファイルは、採用済み技術を役割単位で記録します。

## 読むべき場面

- 採用技術やバージョン方針を確認したいとき
- 新しい採用判断を記録したいとき

| 技術名 | 採用スタック | バージョン | ADR参照 |
| --- | --- | --- | --- |
| Core language | Rust | edition 2024 | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| API server | axum | 0.8.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Async runtime | Tokio | 1.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Project source of truth | `.owox/` JSONL / JSON in Git repo | schema_version v0 | `adr/active/ADR-0002-repo-backed-owox-store.md` |
| Projection / cache database | SQLite | 3.x | `adr/active/ADR-0002-repo-backed-owox-store.md` |
| DB access / migration | SQLx | 0.8.x | `adr/active/ADR-0002-repo-backed-owox-store.md` |
| WebUI | SvelteKit static build | SvelteKit 2.x / Svelte 5.x / adapter-static 3.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Frontend build | Vite | 7.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Package manager | pnpm | 10.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Styling | Tailwind CSS | 4.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Code editor / diff viewer | CodeMirror | 6.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| File tree virtualization | @tanstack/svelte-virtual | 3.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Contract schema | JSON Schema / jsonschema crate | draft 2020-12 / jsonschema 0.46.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| HTTP API contract | OpenAPI | 3.1.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Adapter protocol | JSON / JSONL | schema_version v0 | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Event storage | append-only JSONL | schema_version v0 | `adr/active/ADR-0002-repo-backed-owox-store.md` |
| Logging | tracing | 0.1.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| CLI | clap | 4.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| ID | ULID | ulid 1.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Time | time | 0.3.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Path glob matching | globset | 0.4.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Test | cargo test / insta / assert_cmd / tempfile | insta 1.x / assert_cmd 2.x / tempfile 3.x | `adr/active/ADR-0001-initial-architecture-and-stack.md` |

## バージョン方針

- major はこの表で固定する。
- patch / minor は lockfile で固定する。
- SQLx は 0.9 alpha ではなく 0.8.x stable を使う。
- pnpm は 11 ではなく 10.x を使う。
- `schema_version` は v0 に統一し、HTTP API path `/api/v1` と混同しない。
