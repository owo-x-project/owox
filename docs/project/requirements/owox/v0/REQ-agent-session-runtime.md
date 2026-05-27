---
id: REQ-agent-session-runtime
status: 非推奨
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
---

# Agent Session Runtime

## 目標

この requirement は v0 独立要件として非推奨とする。`owox` v0 は Claude Code、Codex、OpenCode、Gemini CLI などの AI CLI / agent process を agent runtime として扱わず、任意 command の汎用 terminal session として扱う。

## 根拠

`owox` v0 の価値は AI CLI 固有機能の再実装ではなく、terminal session の実行・監視・log 確認を browser workspace に統合することにある。CLI 固有 adapter や agent CLI ごとの特殊 UI は後続 plugin / integration として扱う。

## 対象範囲

- AI CLI / agent process を任意 command として terminal session で起動できる。
- process cwd / environment / command args を workspace 単位で扱える。
- stdout / stderr / terminal output、exit status、log を terminal session として表示できる。

## 対象外

- AI CLI 本体の再実装。
- AI CLI 固有 adapter。
- agent runtime。
- agent CLI ごとの特殊 UI。
- model provider の課金、認証、rate limit 管理。
- 外部仕様管理、作業契約、証拠正本化、検収自動化。
- agent 役割分担、swarm manager、衝突検知。
- approval workflow の正本化。

## 成功指標

- AI CLI を任意 command の terminal session として起動・監視できる。
- session log と exit status を workspace から確認できる。

## 制約 / 品質条件

- AI CLI の自然文完了報告を正本の完了判定にしない。
- `owox` は terminal process 実行状態だけを扱い、agent runtime、検収、証拠正本化は core に内蔵しない。
- process 操作は安全な workspace boundary 内で行う。

## 関連資料

- `REQ-terminal-workspace.md`
- `../../../integrations/external-ai-cli.md`
