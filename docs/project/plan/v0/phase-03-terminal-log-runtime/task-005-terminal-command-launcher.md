# Task 005: Terminal Command Launcher

## 目的

AI CLI を含む任意 command を terminal session として起動できる UI を実装する。

## 前提条件

- terminal session service、renderer、log reconnect がある。
- command launcher pattern が採用済み。

## 作業内容

- command launcher UI を terminal session create に接続する。
- cwd、environment、args、shell command の入力制約を実装する。
- recent command / failed command の表示を追加する。

## 完了条件

- 任意 command を project workspace 内で起動できる。
- AI CLI は固有 adapter なしで起動できる。
- invalid cwd / command failure が error display と log に出る。

## 検証方法

- command launcher state unit test。
- session create route test。
- fake AI CLI command smoke。

## 依存関係

- `task-004-terminal-log-reconnect.md`
- `../../../requirements/owox/v0/REQ-terminal-workspace.md`
- `../../../integrations/external-ai-cli.md`

## 成果物

- command launcher UI。
- 任意 command 起動導線。
