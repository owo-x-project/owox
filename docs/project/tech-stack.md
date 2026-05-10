# 技術スタック

## 目的

このファイルは、採用済み技術を役割単位で記録します。

## 読むべき場面

- 採用技術やバージョン方針を確認したいとき
- 新しい採用判断を記録したいとき

| 技術名 | 採用スタック | バージョン | ADR参照 |
| --- | --- | --- | --- |
| Core language | Rust | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| API server | axum | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Async runtime | Tokio | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Project source of truth | `.owox/` JSONL / JSON in Git repo | tbd | `adr/active/ADR-0002-repo-backed-owox-store.md` |
| Projection / cache database | SQLite | tbd | `adr/active/ADR-0002-repo-backed-owox-store.md` |
| DB access / migration | SQLx | tbd | `adr/active/ADR-0002-repo-backed-owox-store.md` |
| WebUI | SvelteKit static build | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Frontend build | Vite | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Package manager | pnpm | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Styling | Tailwind CSS v4 | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Code editor / diff viewer | CodeMirror 6 | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| File tree virtualization | @tanstack/svelte-virtual | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Contract schema | JSON Schema | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| HTTP API contract | OpenAPI | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Adapter protocol | JSON / JSONL | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Event storage | append-only JSONL | tbd | `adr/active/ADR-0002-repo-backed-owox-store.md` |
| Logging | tracing | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| CLI | clap | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| ID | ULID | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Time | time | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
| Test | cargo test / insta / assert_cmd / tempfile | tbd | `adr/active/ADR-0001-initial-architecture-and-stack.md` |
