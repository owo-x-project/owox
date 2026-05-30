# Terminal Renderer Prototype Checklist (ADR-0003)

This is the task-003 deliverable: the comparison checklist for the terminal
renderer prototype. Both renderers sit behind the same `TerminalRenderer`
adapter (`types.ts`) and are driven by the same WebSocket PTY path, so they can
be compared apples-to-apples per ADR-0003 and `docs/project/validation.md`
("Terminal Renderer Prototype").

The default renderer (`DEFAULT_RENDERER` in `index.ts`) is **provisional**
(`xterm`) and is decided only after this comparison is filled in.

## Status legend

- pass — works without noticeable issue
- partial — works with caveats (see notes)
- fail — broken / unusable
- n/a — not yet measurable (e.g. ghostty stub)

## Comparison matrix

| Criterion        | xterm status | xterm notes                                              | ghostty status | ghostty notes                            |
| ---------------- | ------------ | -------------------------------------------------------- | -------------- | ---------------------------------------- |
| IME              | TBD          | onData delivers composed text as a single string         | n/a            | stub: not available in this build        |
| copy / paste     | TBD          | paste arrives via onData; selection via xterm clipboard  | n/a            | stub: not available in this build        |
| resize           | TBD          | FitAddon.fit() -> onResize -> term.resize(cols,rows)     | n/a            | stub: fit() returns {0,0}, no resize     |
| scrollback       | TBD          | scrollback: 10000 lines configured                       | n/a            | stub: not available in this build        |
| fullscreen CLI   | TBD          | alt-screen apps (vim, htop, less) under PTY              | n/a            | stub: not available in this build        |
| mobile input     | TBD          | soft keyboard + onData; verify on tablet/phone viewport  | n/a            | stub: not available in this build        |
| 10k-line log     | TBD          | bulk write() of a 10k-line stream; watch frame time      | n/a            | stub: not available in this build        |
| initial render   | TBD          | time from mount() to first interactive frame             | n/a            | stub: renders notice only                |
| input latency    | TBD          | keystroke -> echo round trip over the PTY path           | n/a            | stub: not available in this build        |

Fill in `status`/`notes` during the manual prototype run. ghostty stays `n/a`
until a real ghostty-web package replaces `GhosttyRenderer` (the stub) behind
the same interface; until then `availableRenderers()` reports it
`available: false`.

## How to run a manual prototype

1. Start the backend (Rust/Axum PTY server) and the Vite dev server so the
   WebSocket PTY path is live.
2. Mount a renderer via the wave-2 integration surface, selecting the kind with
   `createRenderer(kind)`:
   - `createRenderer("xterm")` — the xterm.js baseline.
   - `createRenderer("ghostty")` — the stub; renders the "not available" notice
     and proves the adapter seam without a real implementation.
3. For each criterion in the matrix, exercise the behaviour and record
   status + notes:
   - IME: compose multibyte input (e.g. Japanese) and confirm committed text.
   - copy/paste: select + copy from the grid, paste a multi-line block.
   - resize: drag the surface / rotate a device; confirm reflow + PTY resize.
   - scrollback: emit > 10k lines; scroll up to the configured limit.
   - fullscreen CLI: run vim / htop / less; check alt-screen + redraw.
   - mobile input: repeat key tests on tablet and phone viewports.
   - 10k-line log: `seq 1 10000` (or `yes | head`) and watch responsiveness.
   - initial render: measure mount() -> first interactive frame.
   - input latency: type and observe local echo / round-trip lag.
4. Record ghostty-web compatibility risks separately when a prototype exists, so
   the adoption decision (ADR-0003 "結果") is evidence-based.
