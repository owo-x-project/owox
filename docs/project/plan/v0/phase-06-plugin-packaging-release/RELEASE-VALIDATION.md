# owox v0 Release Validation

Cross-checks the v0 完了定義 (`../index.md`) and validation方針 (`../../../validation.md`)
against the implementation. Run as the v0 release gate.

## Automated suite (release gate)

| Suite | Command | Result |
| --- | --- | --- |
| Rust unit + integration | `cargo test --workspace` | 91 tests / 19 binaries, all green |
| Rust lint | `cargo clippy --workspace` | 0 warnings |
| TS unit | `npm test` | 157 tests / 16 files, all green |
| TS typecheck | `npm run typecheck` | clean |
| TS lint/format | `npx biome check .` | clean |
| Production build | `npm run build` | succeeds (dist/) |
| E2E workflow smoke | `cargo test -p owox-server --test workflow_smoke` | green (project→terminal→edit→diff→stage→commit→reconnect) |
| AI CLI smoke | `cargo test -p owox-core --test external_ai_cli_smoke` | green |

Failure conditions: any non-green above blocks release.

## v0 完了定義 coverage matrix

| 完了定義 | Status | Evidence |
| --- | --- | --- |
| Browser から project workspace を開き、terminal / AI CLI を起動・監視・終了 | ✅ | project list + workspace shell; terminal session create/get/delete + WS IO; AI CLI = arbitrary command (`external_ai_cli_smoke`); live HTTP smoke |
| Browser reload 後に terminal session / log を再表示 | ✅ | SQLite session metadata + append-log persistence + `GET .../sessions/{id}/log` range replay; `TerminalSurface` reconnect (session list + log tail + live attach); `workflow_smoke` reconnect step |
| file tree / editor / diff / log / Git が同一 workspace で使用可 | ✅ | files tree+content API + CodeMirror editor; DiffView; LogView; SourceControl/ReviewSurface; all mounted in the shell |
| Git status/diff/stage/unstage/discard/commit/branch/fetch/pull/push/sync, 失敗+破壊的操作の表示 | ✅ | `owox_core::git` + `/git/*` routes (porcelain/numstat/branch parsers, op runner); SourceControlPanel; destructive confirm token gate (discard/dirty-checkout); error classification conflict/auth/network/not_found |
| PC/tablet/smartphone 主要操作完了, 操作不可領域なし | ✅ (unit + checklist) | `classifyViewport` + responsive shell + directional mobile sheets + full-screen editor (`shell-responsive.test.ts`); manual `VIEWPORT-SMOKE-CHECKLIST.md` for real-browser confirmation |
| plugin manifest / command contribution / backend hook の予約境界, core に plugin domain 非内蔵 | ✅ | `owox_core::plugin` (parse/validate/load, reserved fields parse-and-ignore, reserved `BackendHook`); `/api/plugins` + `/api/plugins/commands` READ-ONLY (no execute endpoint); launcher shows contributions as reserved/non-runnable |
| unit test が contract/service/UI state を覆い, 最小 release smoke + 手動 checklist が通る | ✅ | 91 Rust + 157 TS tests; workflow + AI CLI smokes; viewport checklist |

## validation.md 観点

- Backend 堅牢性: PTY lifecycle + boundary + WS + reconnect covered by `terminal_lifecycle`, `terminal_ws`, `routes`, `workflow_smoke`.
- Responsive 同等操作: reducer/layout unit tests + manual viewport checklist (browser E2E deferred — see follow-ups).
- Git 操作: `git_parsers`, `git_repo_ops`, `routes` (success/failure/conflict/auth classification, destructive confirm).
- Terminal renderer prototype: xterm baseline shipped; ghostty seam stubbed; `PROTOTYPE-CHECKLIST.md` records the ADR-0003 comparison criteria (default選定 is a follow-up).
- owox core / 外部連携境界: AI CLI handled as arbitrary command, no provider-auth/rate-limit in core (`external_ai_cli_smoke` + scope review); plugin execution intentionally absent.
- 外部依存: Docker packaging authored (`Dockerfile`/`compose.yaml`/`PACKAGING.md`); image includes git+bash; volume/no-volume metadata behavior documented per ADR-0004.

## Scope review (非スコープが core に入っていないこと)

- No AI-CLI-specific adapter / agent runtime — AI CLI is a generic terminal command.
- No provider API / model / billing / rate-limit management in core.
- No plugin arbitrary-code execution; manifest read + reserved boundaries only.
- No external spec-management / work-contract / evidence / acceptance-automation domain in core.
- No Git hosting / CI-CD / deployment reimplementation; remote ops shell out to `git` only.

## Follow-up tasks (carry into v0+ / backlog)

1. **Browser E2E**: add a Playwright (or equivalent) harness for the viewport smoke checklist; current responsive coverage is reducer unit tests + API workflow smoke + manual checklist (intentional per plan's "E2E minimal" stance).
2. **Terminal renderer default**: run the ADR-0003 xterm vs ghostty-web prototype comparison and record the chosen default; ghostty is currently a stub seam.
3. **Docker build smoke**: `docker build` was not run here (no daemon); run the documented build/smoke (`PACKAGING.md`) on a Docker host before publishing the image.
4. **Log retention enforcement**: `select_eviction_candidates` is implemented + unit-tested but not yet wired into an enforcement loop on append/session-create; wire it + surface the cap-reached state in UI.
5. **Frontend bundle size**: dist JS is ~1MB (CodeMirror + xterm); add route/lazy code-splitting.
6. **Redaction refinements**: `redact_secrets` collapses whitespace and decodes per-chunk lossily (possible UTF-8 boundary artifacts); refine to preserve formatting and span chunk boundaries.
7. **Diff transport**: diff uses a pragmatic range-over-patch shape (`{summary, patch, total, truncated}`) rather than the spec's `diff_ref` typed-ref; reconcile the spec or implementation. Same for `term.output` (inline only; large-payload typed-ref not used).
