---
id: REQ-agent-session-runtime
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
---

# Agent Session Runtime

## 目標

`owox` は Claude Code、Codex、OpenCode、Gemini CLI などの AI CLI / agent process を汎用 terminal session として起動、監視、操作する runtime を提供する。

## 根拠

`owox` v0 の価値は AI CLI 固有機能の再実装ではなく、複数 terminal / agent session の実行・監視・log 確認を browser workspace に統合することにある。CLI 固有 adapter は v1 `owlcore` と合わせて扱う。

## 対象範囲

- AI CLI / agent process を command として起動できる。
- process cwd / environment / command args を workspace 単位で扱える。
- stdout / stderr / terminal output を log として表示できる。
- running / exited / failed などの process 状態を表示できる。
- start / stop / reconnect の基本操作を扱う。
- 複数 session を起動、切替、監視できる。

## 対象外

- AI CLI 本体の再実装。
- AI CLI 固有 adapter。
- model provider の課金、認証、rate limit 管理。
- `owlcore` の Work Contract / Evidence 正本化。
- agent 役割分担、swarm manager、衝突検知。
- approval workflow の正本化。

## 成功指標

- 複数 AI CLI session を起動・監視できる。
- session log と status を workspace から確認できる。
- browser reload 後に session / log を再表示できる。

## 制約 / 品質条件

- AI CLI の自然文完了報告を正本の完了判定にしない。
- `owox` は実行状態を扱い、検収・証拠正本化は v1 `owlcore` に委譲する。
- process 操作は安全な workspace boundary 内で行う。

## 関連資料

- `REQ-terminal-workspace.md`
- `../../../integrations/external-ai-cli.md`
