---
id: REQ-agent-session-runtime
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
---

# Agent Session Runtime

## 目標

`owox` は Claude Code、Codex、OpenCode、Gemini CLI などの AI CLI / agent process を起動、監視、操作する runtime を提供する。

## 根拠

`owox` の価値は AI CLI 自体の再実装ではなく、複数 agent の実行・監視・操作面を統合し、plugin が context や approval を接続できる基盤を持つことにある。

## 対象範囲

- AI CLI / agent process を起動できる。
- process cwd / environment / command args を workspace 単位で扱える。
- stdout / stderr / structured log を表示できる。
- input required / approval required / failed / completed などの状態を表示できる。
- cancel / retry / resume の基本操作を扱う。
- plugin が session に context、approval、evidence candidate を紐付けられる拡張点を持つ。

## 対象外

- AI CLI 本体の再実装。
- model provider の課金、認証、rate limit 管理。
- `owlcore` の Work Contract / Evidence 正本化。
- 複雑な swarm manager。

## 成功指標

- 複数 AI CLI session を起動・監視できる。
- session log、status、approval 待ちを workspace から確認できる。
- plugin が session へ context または metadata を関連付けられる。

## 制約 / 品質条件

- AI CLI の自然文完了報告を正本の完了判定にしない。
- `owox` は実行状態を扱い、検収・証拠正本化は plugin に委譲する。
- process 操作は安全な workspace boundary 内で行う。

## 関連資料

- `REQ-terminal-workspace.md`
- `REQ-plugin-host-ui.md`
