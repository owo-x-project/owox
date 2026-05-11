---
id: ADR-0002
status: 採用
date: 2026-05-12
related:
  - docs/project/tech-stack.md
  - docs/project/architecture.md
---

# Rust + Solid Stack

## 判断

`owox` v0 server は Rust + Axum + Tokio、frontend は Solid + Vite + TypeScript を採用する。editor は CodeMirror 6 を第一候補とする。

## 背景

`owox` server は PTY / process / WebSocket / Git / SQLite を扱う。client は terminal、log、diff、editor、responsive UI を高速に描画する必要がある。

## 代替案

- Go server + React / Vite。
- Rust server + React / Vite。
- Node / Bun full-stack。
- SvelteKit。

## 採用理由

- Rust は低メモリ、高速、堅牢な process / IO 管理に向く。
- Axum / Tokio は WebSocket と async server の基盤に向く。
- Solid は fine-grained reactivity により、高頻度更新 UI と軽量体感を狙える。
- CodeMirror 6 は Monaco より v0 の簡易 editor に合う。

## 結果

- 開発速度より runtime 品質を優先する。
- 採用リスクは prototype と E2E 検証で管理する。
- major version は initial implementation 時に固定する。
