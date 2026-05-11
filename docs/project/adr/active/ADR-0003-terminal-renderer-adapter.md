---
id: ADR-0003
status: 採用
date: 2026-05-12
related:
  - docs/project/validation.md
  - docs/project/tech-stack.md
---

# Terminal Renderer Adapter

## 判断

terminal renderer は adapter 境界を設け、xterm.js と ghostty-web を同じ WebSocket PTY 経路で prototype 比較する。

## 背景

`owox` の体験品質は terminal の入力遅延、IME、copy/paste、scrollback、mobile input に大きく依存する。xterm.js は安定実績がある一方、ghostty-web は将来性があるが互換性保証が弱い。

## 代替案

- xterm.js 固定。
- ghostty-web 固定。
- terminal renderer を独自実装する。

## 採用理由

- v0 で安定性と将来性の両方を検証できる。
- renderer 変更が session / PTY / WebSocket 実装へ波及しにくい。
- ghostty-web のリスクを採用前に測れる。

## 結果

- terminal renderer default は prototype 後に決める。
- 検証基準は IME、copy/paste、resize、scrollback、fullscreen CLI、mobile input、1 万行 log、初期表示、入力遅延とする。
