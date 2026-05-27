# Task 006: Command Execution Contract

## 目的

terminal / Git / file operation が共通利用する command execution result と安全処理を実装する。

## 前提条件

- workspace boundary、HTTP API、WebSocket event contract がある。
- destructive confirmation 仕様が採用済み。

## 作業内容

- command execution request / result / status model を実装する。
- stdout / stderr / exit status / started_at / finished_at の保存と通知境界を作る。
- destructive operation 判定と confirmation required response を実装する。
- secret redaction の最小ルールを追加する。

## 完了条件

- command result が HTTP / WebSocket / log metadata で一貫する。
- destructive operation は confirmation なしで実行されない。
- secret 本体が log / docs / metadata に保存されない。

## 検証方法

- command wrapper unit test。
- destructive confirmation unit test。
- redaction unit test。

## 依存関係

- `task-005-websocket-event-contract.md`
- `../../../specs/owox/SPEC-shared-command-execution.md`
- `../../../specs/owox/SPEC-shared-destructive-confirmation.md`
- `../../../patterns/ops-log-retention-redaction.md`

## 成果物

- command execution model。
- confirmation gate。
- redaction utility。
