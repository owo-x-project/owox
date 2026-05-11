# Core Glossary

このファイルは、プロジェクト全体で必読となる共通用語を置きます。

## owox

Open Workspace Orchestrator。AI Agent First な WebUI ベースの Terminal Workspace / 簡易 IDE。code-server のようにブラウザから利用できることを必須条件とし、brand 配下の project repo、terminal session、agent session、log、Git、file tree、簡易 editor、diff を扱う。

## owlcore

`owox` の裏側で使う、project repo に紐づく制御・記録レイヤー。server 常駐型ではなく、project repo 内 `.owox/owlcore/` を正本とする file-based mechanism。Project Metadata、Work Order、Work Contract、Context Capsule、Evidence、Verifier、Policy、Event Log、Agent Session 記録を扱う。

## owox plugin

`owox` に command、backend hook、panel などを追加する拡張単位。v0 は manifest、command contribution、backend hook 予約を最小 extension point とし、汎用 plugin UI 実行基盤は v1 以降で扱う。

## Plugin UI

plugin が `owox` 本体に追加する固有 UI。v0 では本格対応しない。`owlcore` v1 以降で、panel、permission、command integration と合わせて扱う。

## Brand Repo

1 brand 配下で扱う project repo 群。`owox` は 1 brand の Web workspace として、複数 project repo を一覧・選択・操作できる。

## Context

AI Agent や人間が作業判断に使う文脈情報。`owlcore` では Context Capsule として repo 内に記録し、Work Contract や Evidence と関連付ける。

## Work Contract

`owlcore` が AI CLI や人間に渡す作業契約。目的、許可パス、禁止パス、必要文脈、期待成果物、必須 Evidence、受け入れ条件を含む。

## Evidence

作業完了を検収するための証拠。diff、ログ、テスト結果、成果物、確認記録などを含む。

## Verifier

Work Contract と Evidence に基づき、scope、policy、必須証拠、テスト結果、契約準拠を検査する仕組み。

## Official Context

Review や Policy Gate を通過し、正本として継続参照してよい文脈。

## Agent Session

`owox` または `owlcore` が追跡する AI CLI / terminal process の実行単位。v0 `owox` は汎用 terminal session として扱い、v1 `owlcore` は Work Order / Work Contract / Evidence と関連付ける。
