# Core Glossary

このファイルは、プロジェクト全体で必読となる共通用語を置きます。

## owox

Open Workspace Orchestrator。AI Agent First な WebUI ベースの Terminal Workspace / 簡易 IDE。code-server のようにブラウザから利用できることを必須条件とし、owox workspace root 配下の project repo、terminal session、log、Git、file tree、簡易 editor、diff を扱う。

## owox plugin

`owox` に command、backend hook、panel などを追加する拡張単位。v0 は manifest、command contribution、backend hook 予約を最小 extension point とし、汎用 plugin UI 実行基盤は v1 以降で扱う。

## Plugin UI

plugin が `owox` 本体に追加する固有 UI。v0 では本格対応しない。v1 以降で、panel、permission、command integration と合わせて扱う。

## owox workspace root

`owox` v0 が project repo を発見する filesystem root。v0 は owox workspace root 直下の Git repo を project repo として扱う。

## Context

AI Agent や人間が作業判断に使う文脈情報。v0 `owox` は context を独自正本化せず、terminal session、log、Git diff、file tree、editor を通じて作業面から参照できる範囲に留める。

## Official Context

Review を通過し、正本として継続参照してよい文脈。

## Agent Session

AI CLI / terminal process の実行単位。v0 `owox` は agent 専用 runtime ではなく、汎用 terminal session として扱う。
