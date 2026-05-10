# Git CLI

## 役割

Owox が repository、worktree、changed paths、diff、file content、patch apply を扱うためのローカル Git 実行境界。

## 接続境界

- Owox 側は Git CLI を process 実行し、結果を domain / API に渡す。
- `owox-git` は Git 操作結果を返すだけにし、DB へ依存しない。
- Git hosting は Owox の内蔵対象外。

## 認証 / 権限

- ローカル環境の Git credential と filesystem 権限に従う。
- 認証方式、remote 権限、credential 管理は未確定。

## 制約

- `git` CLI が実行環境に存在する必要がある。
- worktree 操作は Work Contract の allowed paths / forbidden paths と Verifier の検査対象にする。

## 障害時の扱い

- Git command 失敗は API 上 `SERVICE_UNAVAILABLE` 相当として扱う初期方針。
- 失敗時は command、対象 path、stderr 要約を Evidence または Event に残す。

## 関連資料

- `../architecture.md`
- `../tech-stack.md`
- `../validation.md`
