---
id: SPEC-flow-ai-cli-session
status: 採用
related:
  - docs/project/requirements/v0/REQ-ai-cli-outsourcing.md
  - docs/project/specs/shared/SPEC-data-work-contract.md
---

# AI CLI Session

## 概要

AI CLI は外部 Worker。Manual Outsource と OpenCode は共通 Session lifecycle を使う。

## 関連要求

- `REQ-ai-cli-outsourcing`

## 入力

- Work Contract revision
- Context Capsule
- target worktree
- adapter kind
- user command / prompt

## 出力

- Session record
- log stream
- result import
- Evidence
- Event

## 挙動

- Session 状態は `draft`, `ready`, `running`, `submitted`, `failed`, `cancelled`, `verified`, `accepted`, `rejected`, `needs_revision`。
- Manual Outsource は prompt / contract を export し、log / diff / evidence / notes を import する。
- OpenCode v0 連携は session lifecycle、streaming、cancel、retry、result import、interactive input を扱う。
- AI CLI は worktree 上で作業する。

## 状態遷移 / 不変条件

- `ready -> running -> submitted`
- `running -> failed | cancelled | submitted`
- `submitted -> verified -> accepted | rejected | needs_revision`
- accepted / rejected / needs_revision は human final gate を通る。

## エラー / 例外

- Contract revision なしの Session start は reject。
- worktree なしの AI CLI Session start は reject。
- required evidence 不足時は accepted にできない。

## 横断ルール

- Session 入出力は Evidence と Event に紐付ける。
- Adapter 固有情報は共通 Session model の拡張 field に閉じる。

## 検証観点

- Manual export/import で同じ Contract revision が追跡できる。
- OpenCode cancel / retry が Event に残る。

## 関連資料

- `../../requirements/v0/REQ-ai-cli-outsourcing.md`
