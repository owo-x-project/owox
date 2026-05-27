# Task 003: Terminal Renderer Adapter

## 目的

terminal renderer を adapter 境界に分離し、xterm.js baseline と ghostty-web prototype 比較の入口を作る。

## 前提条件

- terminal WebSocket IO がある。
- workspace shell に terminal panel を追加できる。

## 作業内容

- renderer adapter interface を定義する。
- xterm.js baseline renderer を実装する。
- ghostty-web prototype を差し替え可能な形で追加する。
- IME、copy/paste、resize、scrollback、mobile input の比較観点を test / checklist 化する。

## 完了条件

- terminal panel で xterm.js renderer が動く。
- renderer を adapter 経由で差し替えられる。
- default renderer 決定に必要な比較観点が記録される。

## 検証方法

- renderer adapter unit test。
- terminal panel component test。
- manual prototype checklist。

## 依存関係

- `task-002-terminal-websocket-io.md`
- `../../../adr/active/ADR-0003-terminal-renderer-adapter.md`

## 成果物

- terminal renderer adapter。
- xterm.js baseline。
- prototype checklist。
