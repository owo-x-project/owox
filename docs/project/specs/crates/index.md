# Crates Specs

## 役割

Rust daemon、domain core、DB、Git、verifier、server、CLI、testkit に閉じる仕様の入口。

## 参照

- `SPEC-crate-owox-protocol.md`: JSON Schema / OpenAPI に対応する Rust 型と validation 境界
- `SPEC-crate-owox-core.md`: domain logic、状態遷移、command result 生成
- `SPEC-crate-owox-store.md`: `.owox/` 正本 file、Event、snapshot、rebuild stream
- `SPEC-crate-owox-db.md`: SQLite projection / cache / index、migration、rebuild
- `SPEC-crate-owox-git.md`: Git CLI、Managed Repo、worktree、diff、Git 履歴判定
- `SPEC-crate-owox-verifier.md`: Work Contract、diff、Evidence、Policy rule の acceptance 前検査
- `SPEC-crate-owox-server.md`: HTTP API、WebUI 配信、command orchestration、OpenCode process 管理
- `SPEC-crate-owox-cli.md`: `owoxd` binary、`init`、`serve`、`doctor`
- `SPEC-crate-owox-testkit.md`: shared fixtures、temporary `.owox/` repo、Git worktree fixture、fixed clock / ID
