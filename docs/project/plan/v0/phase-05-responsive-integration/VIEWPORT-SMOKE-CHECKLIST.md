# v0 Viewport Smoke Checklist

Manual browser smoke for the responsive WebUI. Run `npm run dev` (with the Rust
server up) and exercise each viewport. Automated coverage lives in
`tests/client/shell-responsive.test.ts` (layout/state logic) and
`apps/server/tests/workflow_smoke.rs` (cross-feature API workflow); this checklist
covers what only a real browser can confirm.

## Breakpoints
- smartphone: width < 640px
- tablet: 640px ≤ width < 1024px
- desktop: width ≥ 1024px

## Desktop (≥1024px)
- [ ] Project list in the left drawer; selecting a project binds the shell.
- [ ] Surface switcher toggles terminal / files / review without overlap.
- [ ] Terminal renders (xterm), accepts input, resizes to fit its region.
- [ ] Files: tree expands lazily; editor opens, edits, saves; conflict on stale version.
- [ ] Review: Git status list, stage/unstage, commit, branch picker, sync; diff view renders.
- [ ] Command launcher opens with ⌘/Ctrl+K, creates a session.
- [ ] Error banner + confirm dialog render for a failed op / destructive op.

## Tablet (640–1023px)
- [ ] Drawers overlay the central surface (do not squeeze it to an unusable width).
- [ ] All desktop primary actions remain reachable.
- [ ] No clipped/overlapping panels; terminal/editor/diff stay contained.

## Smartphone (<640px)
- [ ] No persistent bottom navigation.
- [ ] Default surface is the terminal (or project list when none selected).
- [ ] Files opens as a LEFT sheet; terminal as a BOTTOM sheet; review/Git as a RIGHT sheet; command palette as a TOP modal.
- [ ] Only one sheet/modal is open at a time (opening one closes the previous).
- [ ] Opening a file shows the editor full-screen; "Back to terminal" returns to the terminal context.
- [ ] Sheets close via backdrop tap and Esc; the user is never left in an unoperable state.
- [ ] On-screen keyboard does not hide the primary action of the active sheet.

## Cross-viewport
- [ ] Resizing across breakpoints preserves the selected project and active context (no reset).
- [ ] Theme keeps terminal + editor text legible at every viewport.

## Core workflow (any viewport)
- [ ] Open project → start a terminal command → edit a file → view diff → stage → commit.
- [ ] Reload the browser → session list + log re-appear (reconnect + log replay).
