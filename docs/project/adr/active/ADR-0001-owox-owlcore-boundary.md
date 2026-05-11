---
id: ADR-0001
status: 採用
date: 2026-05-12
related:
  - docs/project/architecture.md
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/requirements/owlcore/v1/REQ-owlcore-product-scope.md
---

# owox / owlcore Boundary

## 判断

`owox` は WebUI ベースの Terminal Workspace / 簡易 IDE、`owlcore` は project repo に紐づく local / file-based 制御・記録レイヤーとして分離する。

## 背景

AI Agent First な開発では、実行・操作面と、作業契約・証拠・検収・再現性の記録面が必要になる。これを 1 つの server domain に混ぜると、MVP が肥大化し、repo-local な再現性も弱くなる。

## 代替案

- `owox` に owlcore domain を内蔵する。
- `owlcore` を中央 server / daemon とする。
- `owox` は terminal だけに絞り、repo 記録を扱わない。

## 採用理由

- `owox` v0 は browser から使う作業面に集中できる。
- `owlcore` v1 は `.owox/owlcore/` を正本にし、fresh clone から再構築できる。
- AI CLI 固有連携を v1 に送れるため、v0 の MVP が小さくなる。

## 結果

- v0 `owox` は AI CLI を汎用 terminal session として扱う。
- v1 `owlcore` は Codex を最初の深い CLI adapter 候補にする。
- central server、daemon、remote database を `owlcore` の前提にしない。
