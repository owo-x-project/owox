# External AI CLI

## 役割

Claude Code、Codex、OpenCode、Gemini CLI などの AI CLI は `owox` が置き換えない外部 tool。v0 では固有 adapter を持たず、汎用 terminal session として起動、監視、log 表示する。

## 接続境界

- v0 `owox` は command、cwd、environment、PTY stream、exit status、log を扱う。
- v0 `owox` は provider API、model selection、billing、rate limit を管理しない。
- v1 `owlcore` で Codex を最初の深い CLI adapter 候補にする。

## 認証 / 機密

- provider API key は外部 CLI の設定に委ねる。
- owox は secret 本体を project docs や `.owox/owlcore/` に保存しない。

## 障害時の扱い

- CLI が存在しない、認証失敗、rate limit、network failure の場合、owox は terminal / log 上の失敗として表示する。
- CLI 固有の復旧手順は v0 では持たない。

## 関連資料

- `../requirements/owox/v0/REQ-agent-session-runtime.md`
- `../requirements/owlcore/v1/REQ-owlcore-product-scope.md`
