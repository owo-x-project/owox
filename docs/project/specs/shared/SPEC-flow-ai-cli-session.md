---
id: SPEC-flow-ai-cli-session
status: 採用
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-ai-cli-outsourcing.md
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

## OpenCode Managed Process

- `owox-server` は OpenCode process を child process として起動する。
- process cwd は task worktree root。
- 起動入力は Work Contract、Context Capsule、target paths、禁止 path、期待 Evidence を含む prompt file。
- stdout JSONL を優先 stream とする。JSONL として parse できない行は raw log として保存する。
- stderr は raw diagnostic log として保存し、UI には typed event へ変換して表示する。
- stream event は `session.started`, `session.output`, `session.input_requested`, `session.tool_call`, `session.evidence_hint`, `session.finished`, `session.failed` を扱う。
- interactive input は `session.input` command から stdin または adapter protocol へ送る。
- cancel はまず graceful cancel を送り、timeout 後に process kill する。
- retry は同じ Work Contract revision と新しい Session ID で開始し、元 Session へ `retry_of` link を持つ。
- result import は process exit 後に diff、changed paths、log、test result candidate を Evidence candidate として登録する。

## 状態遷移 / 不変条件

- `ready -> running -> submitted`
- `running -> failed | cancelled | submitted`
- `submitted -> verified -> accepted | rejected | needs_revision`
- accepted / rejected / needs_revision は human final gate を通る。

## エラー / 例外

- Contract revision なしの Session start は reject。
- worktree なしの AI CLI Session start は reject。
- required evidence 不足時は accepted にできない。
- OpenCode executable が見つからない場合は `SESSION_ADAPTER_NOT_FOUND`。
- process 起動失敗は `failed`。
- stream parse 失敗は raw log 保存後、session は継続する。
- process exit code 非 0 は `failed`。ただし diff / log は Evidence candidate として保持する。
- cancel timeout 後の kill 失敗は `SESSION_CANCEL_FAILED`。
- retry は `running` 中 Session には実行不可。

## 横断ルール

- Session 入出力は Evidence と Event に紐付ける。
- Adapter 固有情報は共通 Session model の拡張 field に閉じる。

## 検証観点

- Manual export/import で同じ Contract revision が追跡できる。
- OpenCode cancel / retry が Event に残る。

## 関連資料

- `../../requirements/archive/legacy-control-plane/v0/REQ-ai-cli-outsourcing.md`
